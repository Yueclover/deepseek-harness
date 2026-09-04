import { describe, expect, it, vi } from 'vitest'
import type { Screenshot } from '@deepseek-ai/dsh-screenshot'
import { ScreenshotCaptureId } from '@deepseek-ai/dsh-screenshot'
import { captureScreenshotToClipboard } from '../src/index.ts'

describe('screenshot clipboard action', () => {
  it('copies a completed capture and leaves cancellation untouched', async () => {
    const image = { mediaType: 'image/png' as const, data: new Uint8Array([1]), width: 1, height: 1 }
    const copyToClipboard = vi.fn(async () => {})
    const screenshot = {
      capture: vi.fn(async () => ({ kind: 'captured' as const, captureId: ScreenshotCaptureId('done'), image })),
      copyToClipboard,
    } as unknown as Screenshot
    await expect(captureScreenshotToClipboard({ screenshot }, new AbortController().signal)).resolves.toBe(true)
    expect(copyToClipboard).toHaveBeenCalledWith(image, expect.any(AbortSignal))

    screenshot.capture = vi.fn(async () => ({ kind: 'cancelled' as const, captureId: ScreenshotCaptureId('cancelled') }))
    await expect(captureScreenshotToClipboard({ screenshot }, new AbortController().signal)).resolves.toBe(false)
    expect(copyToClipboard).toHaveBeenCalledOnce()
  })
})
