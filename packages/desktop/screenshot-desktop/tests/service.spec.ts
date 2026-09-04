/** Screenshot provider registration, forwarding, and disposal behavior. */

import { Context } from '@deepseek-ai/cordis'
import DesktopBridge from '@deepseek-ai/dsh-desktop-bridge'
import type { DesktopBridgeEventMap, DesktopBridgeEventName, DesktopBridgeRequestMap, DesktopBridgeRequestName } from '@deepseek-ai/dsh-desktop-bridge'
import { ScreenshotCaptureId } from '@deepseek-ai/dsh-screenshot'
import { describe, expect, it, vi } from 'vitest'
import DesktopScreenshot from '../src/index.ts'

const requestMock = vi.fn(async (
  _method: unknown,
  _payload: unknown,
  _signal?: AbortSignal,
) => ({ kind: 'cancelled' as const }))

class FakeBridge extends DesktopBridge {
  request = requestMock as unknown as <K extends DesktopBridgeRequestName>(
    method: K,
    payload: DesktopBridgeRequestMap[K]['request'],
    signal?: AbortSignal,
  ) => Promise<DesktopBridgeRequestMap[K]['response']>
  on<K extends DesktopBridgeEventName>(_event: K, _listener: (payload: DesktopBridgeEventMap[K]) => void): () => void {
    return () => {}
  }
}

describe('DesktopScreenshot', () => {
  it('forwards capture through the bridge and leaves with its fiber', async () => {
    const ctx = new Context()
    const bridgeFiber = ctx.plugin(FakeBridge)
    await bridgeFiber.await()
    const fiber = ctx.plugin(DesktopScreenshot)
    await fiber.await()
    const request = { captureId: ScreenshotCaptureId('capture-1'), mode: 'region', annotations: false } as const

    await expect(ctx.screenshot.capture(request)).resolves.toEqual({ kind: 'cancelled', captureId: request.captureId })
    expect(requestMock).toHaveBeenCalledWith('screen/capture-region', {}, undefined)
    await fiber.dispose()
    expect(ctx.get('screenshot')).toBeUndefined()
    await bridgeFiber.dispose()
  })
})
