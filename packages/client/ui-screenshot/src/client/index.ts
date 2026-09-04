import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import screenshotAssistantRemote from '@deepseek-ai/dsh-screenshot-assistant/remote'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { ScreenshotButton, type ScreenshotButtonState } from './ScreenshotButton.tsx'
import { en, zh, type ScreenshotUiKey } from './locales.ts'

export { ScreenshotButton } from './ScreenshotButton.tsx'
export type { ScreenshotButtonProps, ScreenshotButtonState } from './ScreenshotButton.tsx'
export type { ScreenshotUiKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap { screenshotAssistant: ScreenshotUiKey }
}

/** Business operations injected into the screenshot composer control. */
export interface ScreenshotButtonInjected {
  capture(prompt: string): Promise<Exclude<ScreenshotButtonState, 'idle' | 'capturing' | 'failed'>>
}

const NS = 'screenshotAssistant'

/** Required services for mounting the Desktop Remote and its composer UI. */
export const inject = ['slots', 'remote', 'locale']

function registerUi(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-screenshot: dictionaries')
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left',
    id: 'desktop-screenshot',
    order: 20,
    locale: NS,
    inject: (sessionId: SessionId): ScreenshotButtonInjected => ({
      capture: async (prompt) => {
        const result = await ctx.remote.screenshotAssistant.capture({ sessionId, prompt, annotations: false })
        if (!result.ok) throw new Error(`${result.error.message} (${result.error.code})`)
        return result.value.accepted ? 'sent' : 'cancelled'
      },
    }),
  }, ScreenshotButton))
}

/**
 * Register the Desktop screenshot control for every materialized Session composer.
 * @param ctx - Client root context.
 */
export async function apply(ctx: ClientContext): Promise<() => Promise<void>> {
  const disposeRemote = await ctx.remote.$mount(screenshotAssistantRemote)
  const ui = ctx.inject(['remote.screenshotAssistant', 'slots', 'locale'], registerUi)
  try {
    await ui
  } catch (error) {
    await ui.dispose()
    await disposeRemote()
    throw error
  }
  return async () => {
    await ui.dispose()
    await disposeRemote()
  }
}
