/** Bidirectional request runtime over one owned Desktop Bridge transport. */

import { randomUUID } from 'node:crypto'
import { brandString } from '@deepseek-ai/dsh-brand'
import type {
  DesktopBridgeEventMap,
  DesktopBridgeEventName,
  DesktopBridgeFrame,
  DesktopBridgeRequestId,
  DesktopBridgeRequestMap,
  DesktopBridgeRequestName,
} from './protocol.ts'
import { isDesktopBridgeFrame } from './protocol.ts'

/** Transport used by one Desktop Bridge endpoint. */
export interface DesktopBridgeTransport {
  send(frame: DesktopBridgeFrame): void
  subscribe(listener: (message: unknown) => void): () => void
}

type RequestOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['request']
type ResponseOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['response']
type RequestHandler = (payload: unknown, signal: AbortSignal) => Promise<unknown>

interface PendingRequest {
  resolve(value: unknown): void
  reject(error: Error): void
  detachAbort(): void
}

/** Failure returned by a handler on the other endpoint. */
export class DesktopBridgeRemoteError extends Error {
  /** @param code - stable handler failure code. @param message - remote failure description. */
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'DesktopBridgeRemoteError'
  }
}

/**
 * One side of a Desktop Bridge connection. It rejects pending requests and
 * aborts inbound work during disposal, then waits for every handler to settle.
 */
export class DesktopBridgeEndpoint {
  private readonly pending = new Map<DesktopBridgeRequestId, PendingRequest>()
  private readonly inbound = new Map<DesktopBridgeRequestId, AbortController>()
  private readonly active = new Set<Promise<void>>()
  private readonly handlers = new Map<string, RequestHandler>()
  private readonly listeners = new Map<string, Set<(payload: unknown) => void>>()
  private readonly unsubscribe: () => void
  private disposed = false

  /** @param transport - connected transport whose ownership stays with the caller. */
  constructor(private readonly transport: DesktopBridgeTransport) {
    this.unsubscribe = transport.subscribe((message) => { this.receive(message) })
  }

  /**
   * Send a typed request and propagate caller cancellation.
   * @param method - Registered method.
   * @param payload - Method payload.
   * @param signal - Optional cancellation signal.
   * @returns The remote response.
   */
  request<K extends DesktopBridgeRequestName>(
    method: K,
    payload: RequestOf<K>,
    signal?: AbortSignal,
  ): Promise<ResponseOf<K>> {
    if (this.disposed) return Promise.reject(new Error('desktop bridge is disposed'))
    signal?.throwIfAborted()
    const requestId = brandString<DesktopBridgeRequestId>(randomUUID())
    return new Promise<ResponseOf<K>>((resolve, reject) => {
      const onAbort = (): void => {
        this.pending.delete(requestId)
        this.transport.send({ type: 'cancel', requestId })
        reject(toError(signal?.reason, 'desktop bridge request aborted'))
      }
      signal?.addEventListener('abort', onAbort, { once: true })
      this.pending.set(requestId, {
        resolve: (value) => { resolve(value as ResponseOf<K>) },
        reject,
        detachAbort: () => { signal?.removeEventListener('abort', onAbort) },
      })
      try {
        this.transport.send({ type: 'request', requestId, method, payload })
      } catch (error) {
        this.pending.delete(requestId)
        signal?.removeEventListener('abort', onAbort)
        reject(toError(error, 'desktop bridge send failed'))
      }
    })
  }

  /**
   * Register one request handler and reject duplicate ownership.
   * @param method - Registered method.
   * @param handler - Request handler.
   * @returns A registration disposer.
   */
  handle<K extends DesktopBridgeRequestName>(
    method: K,
    handler: (payload: RequestOf<K>, signal: AbortSignal) => ResponseOf<K> | Promise<ResponseOf<K>>,
  ): () => void {
    if (this.disposed) throw new Error('desktop bridge is disposed')
    if (this.handlers.has(method)) throw new Error(`desktop bridge handler already registered: ${method}`)
    this.handlers.set(method, (payload, signal) => Promise.resolve(
      handler(payload as RequestOf<K>, signal),
    ))
    return () => { this.handlers.delete(method) }
  }

  /**
   * Publish one typed event to the remote endpoint.
   * @param event - Registered event name.
   * @param payload - Event payload.
   */
  emit<K extends DesktopBridgeEventName>(event: K, payload: DesktopBridgeEventMap[K]): void {
    if (this.disposed) throw new Error('desktop bridge is disposed')
    this.transport.send({ type: 'event', event, payload })
  }

  /**
   * Register an event listener while containing subscriber exceptions.
   * @param event - Registered event name.
   * @param listener - Event recipient.
   * @returns A subscription disposer.
   */
  on<K extends DesktopBridgeEventName>(event: K, listener: (payload: DesktopBridgeEventMap[K]) => void): () => void {
    if (this.disposed) throw new Error('desktop bridge is disposed')
    let group = this.listeners.get(event)
    if (group === undefined) {
      group = new Set()
      this.listeners.set(event, group)
    }
    const erased = listener as (payload: unknown) => void
    group.add(erased)
    return () => {
      group.delete(erased)
      if (group.size === 0) this.listeners.delete(event)
    }
  }

  /**
   * Stop dispatch and wait for handler quiescence.
   * @param reason - Failure delivered to pending work.
   * @returns When active handlers have settled.
   */
  async dispose(reason: Error = new Error('desktop bridge disconnected')): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.unsubscribe()
    for (const pending of this.pending.values()) {
      pending.detachAbort()
      pending.reject(reason)
    }
    this.pending.clear()
    for (const controller of this.inbound.values()) controller.abort(reason)
    this.inbound.clear()
    this.handlers.clear()
    this.listeners.clear()
    await Promise.allSettled([...this.active])
  }

  private receive(message: unknown): void {
    if (this.disposed || !isDesktopBridgeFrame(message)) return
    if (message.type === 'request') {
      this.startInbound(message)
      return
    }
    if (message.type === 'cancel') {
      this.inbound.get(message.requestId)?.abort(new Error('desktop bridge request cancelled'))
      return
    }
    if (message.type === 'event') {
      for (const listener of this.listeners.get(message.event) ?? []) {
        try { listener(message.payload) } catch { /* A subscriber cannot starve later subscribers. */ }
      }
      return
    }
    const pending = this.pending.get(message.requestId)
    if (pending === undefined) return
    this.pending.delete(message.requestId)
    pending.detachAbort()
    if (message.type === 'response') pending.resolve(message.result)
    else pending.reject(new DesktopBridgeRemoteError(message.error.code, message.error.message))
  }

  private startInbound(frame: Extract<DesktopBridgeFrame, { type: 'request' }>): void {
    const handler = this.handlers.get(frame.method)
    if (handler === undefined) {
      this.transport.send({
        type: 'error',
        requestId: frame.requestId,
        error: { code: 'method-unavailable', message: `Desktop method is unavailable: ${frame.method}` },
      })
      return
    }
    if (this.inbound.has(frame.requestId)) return
    const controller = new AbortController()
    this.inbound.set(frame.requestId, controller)
    const work = Promise.resolve()
      .then(() => handler(frame.payload, controller.signal))
      .then((result) => {
        if (!this.disposed) this.transport.send({ type: 'response', requestId: frame.requestId, result })
      })
      .catch((error: unknown) => {
        if (this.disposed) return
        const message = error instanceof Error ? error.message : String(error)
        this.transport.send({ type: 'error', requestId: frame.requestId, error: { code: 'handler-failed', message } })
      })
      .finally(() => {
        this.inbound.delete(frame.requestId)
        this.active.delete(work)
      })
    this.active.add(work)
  }
}

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) return value
  return new Error(typeof value === 'string' ? value : fallback)
}
