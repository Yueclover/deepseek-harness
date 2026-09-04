import { describe, expect, it, vi } from 'vitest'
import { ScreenshotCaptureId, type Screenshot } from '@deepseek-ai/dsh-screenshot'
import type ScreenshotTargets from '@deepseek-ai/dsh-screenshot-target'
import type { ScreenshotTargetRequest } from '@deepseek-ai/dsh-screenshot-target'
import { ScreenshotTargetId } from '@deepseek-ai/dsh-screenshot-target'
import { SessionId } from '@deepseek-ai/dsh-session'
import { captureScreenshotAssistant } from '../src/index.ts'

describe('captureScreenshotAssistant', () => {
  it('delivers captured PNG bytes through the exact selected target', async () => {
    const capture = vi.fn(async () => ({
      kind: 'captured' as const,
      captureId: ScreenshotCaptureId('capture'),
      image: { mediaType: 'image/png' as const, data: new Uint8Array([1, 2, 3]), width: 1, height: 1 },
    }))
    const send = vi.fn(async (
      _targetId: ScreenshotTargetId,
      _request: ScreenshotTargetRequest,
      _signal: AbortSignal,
    ) => {})
    await expect(captureScreenshotAssistant({
      screenshot: { capture } as unknown as Screenshot,
      screenshotTargets: { send } as unknown as ScreenshotTargets,
    }, { sessionId: SessionId('session'), prompt: 'Analyze this', annotations: false }, ScreenshotTargetId('dsh-agent'), new AbortController().signal))
      .resolves.toEqual({ accepted: true })
    expect(send).toHaveBeenCalledOnce()
    const [targetId, delivered, deliveredSignal] = send.mock.calls[0]!
    expect(targetId).toBe('dsh-agent')
    expect(delivered).toEqual({
      sessionId: 'session',
      prompt: 'Analyze this',
      source: 'composer',
      image: { mediaType: 'image/png', data: new Uint8Array([1, 2, 3]), width: 1, height: 1 },
    })
    expect(deliveredSignal).toBeInstanceOf(AbortSignal)
  })

  it('does not submit when capture is cancelled', async () => {
    const send = vi.fn()
    await expect(captureScreenshotAssistant({
      screenshot: { capture: vi.fn(async () => ({ kind: 'cancelled', captureId: ScreenshotCaptureId('capture') })) } as unknown as Screenshot,
      screenshotTargets: { send } as unknown as ScreenshotTargets,
    }, { sessionId: SessionId('session'), prompt: 'Analyze this', annotations: false }, ScreenshotTargetId('dsh-agent'), new AbortController().signal))
      .resolves.toEqual({ accepted: false, reason: 'cancelled' })
    expect(send).not.toHaveBeenCalled()
  })

  it('rejects an empty prompt before opening capture', async () => {
    const capture = vi.fn()
    await expect(captureScreenshotAssistant({
      screenshot: { capture } as unknown as Screenshot,
      screenshotTargets: {} as ScreenshotTargets,
    }, { sessionId: SessionId('session'), prompt: '  ', annotations: false }, ScreenshotTargetId('dsh-agent'), new AbortController().signal))
      .rejects.toThrow('prompt must not be empty')
    expect(capture).not.toHaveBeenCalled()
  })
})
