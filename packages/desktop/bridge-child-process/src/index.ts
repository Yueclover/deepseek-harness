/** Desktop Bridge provider backed by the Node IPC channel inherited from the Electron parent. */

import type { Context } from '@deepseek-ai/cordis'
import DesktopBridge from '@deepseek-ai/dsh-desktop-bridge'
import type {
  DesktopBridgeEventMap,
  DesktopBridgeEventName,
  DesktopBridgeFrame,
  DesktopBridgeRequestMap,
  DesktopBridgeRequestName,
  DesktopBridgeTransport,
} from '@deepseek-ai/dsh-desktop-bridge'
import { DesktopBridgeEndpoint } from '@deepseek-ai/dsh-desktop-bridge'

type RequestOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['request']
type ResponseOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['response']

/**
 * Adapt the current child process to the shared transport.
 * @returns A transport over the current Node child-process IPC channel.
 */
export function childProcessDesktopTransport(): DesktopBridgeTransport {
  if (process.send === undefined) {
    throw new Error('desktop bridge requires a Node child-process IPC channel')
  }
  return {
    send(frame: DesktopBridgeFrame): void {
      if (!process.connected || process.send === undefined) {
        throw new Error('desktop bridge parent is disconnected')
      }
      process.send(frame)
    },
    subscribe(listener): () => void {
      const onMessage = (message: unknown): void => { listener(message) }
      process.on('message', onMessage)
      return () => { process.off('message', onMessage) }
    },
  }
}

/** Host-side `ctx.desktopBridge` implementation over the Electron-owned child IPC channel. */
export default class ChildProcessDesktopBridge extends DesktopBridge {
  private readonly endpoint: DesktopBridgeEndpoint

  constructor(ctx: Context) {
    super(ctx)
    this.endpoint = new DesktopBridgeEndpoint(childProcessDesktopTransport())
    ctx.effect(() => async () => {
      await this.endpoint.dispose()
    }, 'desktopBridge.childProcess')
  }

  /**
   * Send one request to the Electron parent.
   * @param method - Registered Desktop method.
   * @param payload - Method payload.
   * @param signal - Optional cancellation signal.
   * @returns The Desktop response.
   */
  request<K extends DesktopBridgeRequestName>(method: K, payload: RequestOf<K>, signal?: AbortSignal): Promise<ResponseOf<K>> {
    return this.endpoint.request(method, payload, signal)
  }

  /**
   * Subscribe to an event published by the Electron parent.
   * @param event - Registered event name.
   * @param listener - Event recipient.
   * @returns A subscription disposer.
   */
  on<K extends DesktopBridgeEventName>(event: K, listener: (payload: DesktopBridgeEventMap[K]) => void): () => void {
    return this.endpoint.on(event, listener)
  }
}
