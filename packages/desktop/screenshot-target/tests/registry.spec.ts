import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import ScreenshotTargets, { ScreenshotTargetId } from '../src/index.ts'

describe('ScreenshotTargets', () => {
  it('registers, dispatches, and removes independently installed targets', async () => {
    const ctx = new Context()
    const fiber = ctx.plugin(ScreenshotTargets)
    await fiber.await()
    const send = vi.fn(async () => {})
    const dispose = ctx.screenshotTargets.register({ id: ScreenshotTargetId('dsh-agent'), displayName: 'DSH Agent', send })
    const request = {
      image: { mediaType: 'image/png' as const, data: new Uint8Array([1]), width: 1, height: 1 },
      prompt: 'Analyze',
      source: 'composer' as const,
    }
    const signal = new AbortController().signal

    await ctx.screenshotTargets.send(ScreenshotTargetId('dsh-agent'), request, signal)
    expect(send).toHaveBeenCalledWith(request, signal)
    dispose()
    await expect(ctx.screenshotTargets.send(ScreenshotTargetId('dsh-agent'), request, signal))
      .rejects.toThrow('target is unavailable')
    await fiber.dispose()
  })
})
