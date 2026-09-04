/** Desktop Bridge Service Definition for Host-to-shell requests and shell-to-Host events. */

import { Context, Service } from '@deepseek-ai/cordis'
import type { DesktopBridgeEventMap, DesktopBridgeEventName, DesktopBridgeRequestMap, DesktopBridgeRequestName } from './protocol.ts'

export * from './protocol.ts'
export * from './runtime.ts'
export * from './capabilities.ts'

declare module '@deepseek-ai/cordis' {
  interface Context {
    desktopBridge: DesktopBridge
  }
}

type RequestOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['request']
type ResponseOf<K extends DesktopBridgeRequestName> = DesktopBridgeRequestMap[K]['response']

/** Host-facing access to capabilities registered by the attached Desktop shell. */
export abstract class DesktopBridge extends Service {
  constructor(ctx: Context) {
    super(ctx, 'desktopBridge')
  }

  /**
   * Send one typed request to the Desktop shell.
   * @param method - Registered Desktop method.
   * @param payload - Method payload.
   * @param signal - Optional cancellation signal.
   * @returns The Desktop response.
   */
  abstract request<K extends DesktopBridgeRequestName>(
    method: K,
    payload: RequestOf<K>,
    signal?: AbortSignal,
  ): Promise<ResponseOf<K>>

  /**
   * Subscribe to one typed Desktop event.
   * @param event - Registered event name.
   * @param listener - Event recipient.
   * @returns A subscription disposer.
   */
  abstract on<K extends DesktopBridgeEventName>(
    event: K,
    listener: (payload: DesktopBridgeEventMap[K]) => void,
  ): () => void
}

export default DesktopBridge
