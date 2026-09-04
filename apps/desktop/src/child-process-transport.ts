/** Electron-parent transport adapter for the Harness child's Node IPC channel. */

import type { ChildProcess } from 'node:child_process'
import type { DesktopBridgeFrame, DesktopBridgeTransport } from '@deepseek-ai/dsh-desktop-bridge'

/** Adapt one connected Harness child without taking ownership of its lifetime. */
export function parentProcessDesktopTransport(child: ChildProcess): DesktopBridgeTransport {
  if (!child.connected) {
    throw new Error('desktop bridge requires a connected Harness child-process IPC channel')
  }
  return {
    send(frame: DesktopBridgeFrame): void {
      if (!child.connected) {
        throw new Error('desktop bridge Harness child is disconnected')
      }
      child.send(frame)
    },
    subscribe(listener): () => void {
      const onMessage = (message: unknown): void => { listener(message) }
      child.on('message', onMessage)
      return () => { child.off('message', onMessage) }
    },
  }
}
