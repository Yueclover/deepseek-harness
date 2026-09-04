/** Desktop Bridge request, cancellation, event, and disposal behavior over an in-memory transport. */

import { describe, expect, it, vi } from 'vitest'
import type { DesktopBridgeFrame, DesktopBridgeTransport } from '../src/index.ts'
import { DesktopBridgeEndpoint, DesktopBridgeRemoteError } from '../src/index.ts'

declare module '../src/protocol.ts' {
  interface DesktopBridgeRequestMap {
    echo: { request: { text: string }; response: { text: string } }
    wait: { request: {}; response: { finished: true } }
  }
  interface DesktopBridgeEventMap {
    changed: { value: number }
  }
}

interface LinkedTransport extends DesktopBridgeTransport {
  deliver(frame: DesktopBridgeFrame): void
}

function transportPair(): [LinkedTransport, LinkedTransport] {
  const listeners: Array<Set<(message: unknown) => void>> = [new Set(), new Set()]
  const make = (own: number, peer: number): LinkedTransport => ({
    send(frame) {
      queueMicrotask(() => {
        for (const listener of listeners[peer]!) listener(frame)
      })
    },
    subscribe(listener) {
      listeners[own]!.add(listener)
      return () => { listeners[own]!.delete(listener) }
    },
    deliver(frame) {
      for (const listener of listeners[own]!) listener(frame)
    },
  })
  return [make(0, 1), make(1, 0)]
}

describe('DesktopBridgeEndpoint', () => {
  it('routes a typed request and unregisters its handler', async () => {
    const [leftTransport, rightTransport] = transportPair()
    const left = new DesktopBridgeEndpoint(leftTransport)
    const right = new DesktopBridgeEndpoint(rightTransport)
    const unregister = right.handle('echo', request => ({ text: request.text.toUpperCase() }))

    await expect(left.request('echo', { text: 'hello' })).resolves.toEqual({ text: 'HELLO' })
    unregister()
    await expect(left.request('echo', { text: 'again' })).rejects.toEqual(
      new DesktopBridgeRemoteError('method-unavailable', 'Desktop method is unavailable: echo'),
    )

    await Promise.all([left.dispose(), right.dispose()])
  })

  it('propagates cancellation and waits for the handler to stop during disposal', async () => {
    const [leftTransport, rightTransport] = transportPair()
    const left = new DesktopBridgeEndpoint(leftTransport)
    const right = new DesktopBridgeEndpoint(rightTransport)
    const handlerStopped = Promise.withResolvers<undefined>()
    right.handle('wait', async (_request, signal) => {
      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => { resolve() }, { once: true })
      })
      handlerStopped.resolve(undefined)
      throw signal.reason
    })
    const controller = new AbortController()
    const request = left.request('wait', {}, controller.signal)
    await Promise.resolve()
    controller.abort(new Error('caller stopped'))

    await expect(request).rejects.toThrow('caller stopped')
    await right.dispose()
    await expect(handlerStopped.promise).resolves.toBeUndefined()
    await left.dispose()
  })

  it('contains one event listener failure and calls later listeners', async () => {
    const [leftTransport, rightTransport] = transportPair()
    const left = new DesktopBridgeEndpoint(leftTransport)
    const right = new DesktopBridgeEndpoint(rightTransport)
    const later = vi.fn()
    left.on('changed', () => { throw new Error('listener failed') })
    left.on('changed', later)

    right.emit('changed', { value: 3 })
    await vi.waitFor(() => { expect(later).toHaveBeenCalledWith({ value: 3 }) })

    await Promise.all([left.dispose(), right.dispose()])
  })

  it('ignores malformed process messages', async () => {
    const [leftTransport] = transportPair()
    const left = new DesktopBridgeEndpoint(leftTransport)
    leftTransport.deliver({ type: 'response', requestId: 4 } as never)
    leftTransport.deliver(null as never)
    await left.dispose()
  })
})
