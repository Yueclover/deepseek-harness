import { Context, Service } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { ScreenshotButton } from '../src/client/ScreenshotButton.tsx'
import { apply, inject, type ScreenshotButtonInjected } from '../src/client/index.ts'

const SESSION = 'screenshot-session' as SessionId

describe('screenshot browser plugin', () => {
  it('mounts its generated Remote contribution before registering the composer control', async () => {
    const ctx = new Context()
    const capture = vi.fn(async () => ({ ok: true as const, value: { accepted: true as const } }))
    const disposeMount = vi.fn(() => Promise.resolve())
    const mount = vi.fn(async (contribution: { package: string }) => {
      expect(contribution.package).toBe('@deepseek-ai/dsh-screenshot-assistant')
      const disposeNamespace = ctx.reflect.provide('remote.screenshotAssistant', { capture })
      return async () => {
        await disposeNamespace()
        await disposeMount()
      }
    })
    class RemoteService extends Service {
      constructor(serviceCtx: Context) {
        super(serviceCtx, 'remote')
      }

      $mount(contribution: { package: string }): Promise<() => Promise<void>> {
        return mount(contribution)
      }
    }
    new RemoteService(ctx)
    ctx.provide('locale', new LocaleRuntime(ctx))
    await ctx.plugin(SlotRegistry).await()
    ctx.slots.register({
      name: 'root',
      children: { 'conversation.input.left': { kind: 'list', scope: 'session' } },
    } as never, () => null)

    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const entry = ctx.slots.entries('conversation.input.left')
      .find(candidate => candidate.component === ScreenshotButton)
    expect(mount).toHaveBeenCalledOnce()
    expect(entry).toMatchObject({ options: { id: 'desktop-screenshot', order: 20 } })
    const injected = (entry?.inject as unknown as (sessionId: SessionId) => ScreenshotButtonInjected)(SESSION)
    await expect(injected.capture('Describe this')).resolves.toBe('sent')
    expect(capture).toHaveBeenCalledWith({ sessionId: SESSION, prompt: 'Describe this', annotations: false })

    await fiber.dispose()
    expect(disposeMount).toHaveBeenCalledOnce()
  })
})
