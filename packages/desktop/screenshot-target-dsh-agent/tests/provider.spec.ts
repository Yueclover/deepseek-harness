import { Context } from '@deepseek-ai/cordis'
import type SessionController from '@deepseek-ai/dsh-api-session-controller'
import { SessionId } from '@deepseek-ai/dsh-session'
import { describe, expect, it, vi } from 'vitest'
import ScreenshotTargets, { ScreenshotTargetId } from '@deepseek-ai/dsh-screenshot-target'
import { apply } from '../src/index.ts'

describe('DSH Agent screenshot target', () => {
  it('uses Session prompt admission and requires an explicit Session', async () => {
    const ctx = new Context()
    const targetsFiber = ctx.plugin(ScreenshotTargets)
    await targetsFiber.await()
    const prompt = vi.fn(async () => ({ accepted: true as const }))
    ctx.provide('sessionController', { prompt } as unknown as SessionController)
    const providerFiber = ctx.plugin({ inject: ['screenshotTargets', 'sessionController'], apply })
    await providerFiber.await()
    const signal = new AbortController().signal
    const request = {
      image: { mediaType: 'image/png' as const, data: new Uint8Array([1, 2, 3]), width: 1, height: 1 },
      prompt: 'Analyze',
      source: 'composer' as const,
    }

    await expect(ctx.screenshotTargets.send(ScreenshotTargetId('dsh-agent'), request, signal))
      .rejects.toThrow('requires an active Session')
    await expect(ctx.screenshotTargets.send(ScreenshotTargetId('dsh-agent'), {
      ...request,
      sessionId: SessionId('session-1'),
    }, signal)).resolves.toBeUndefined()
    expect(prompt).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'session-1',
      mode: 'queue',
      content: [
        { type: 'text', text: 'Analyze' },
        expect.objectContaining({ type: 'image', mediaType: 'image/png', data: 'AQID', name: 'screenshot.png' }),
      ],
    }), signal)
    await providerFiber.dispose()
    await targetsFiber.dispose()
  })
})
