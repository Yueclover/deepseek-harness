/** Screenshot input contribution kept independent from physical device providers. */

import { randomUUID } from 'node:crypto'
import type DesktopInput from '@deepseek-ai/dsh-desktop-input'
import {
  InputActionId,
  InputBindingId,
  InputControlId,
  InputDeviceId,
  type InputActionEvent,
} from '@deepseek-ai/dsh-desktop-input'
import { ScreenshotCaptureId, type Screenshot } from '@deepseek-ai/dsh-screenshot'

/** Stable action selected by the default MiMouse screenshot-button binding. */
export const SCREENSHOT_COPY_ACTION = InputActionId('screenshot.capture-copy')

/** Stable identity of the screenshot assistant's default physical binding. */
export const SCREENSHOT_DEFAULT_BINDING = InputBindingId('screenshot.default')

/** Services needed to complete one capture-and-copy operation. */
export interface ScreenshotActionContext { readonly screenshot: Screenshot }

/**
 * Capture one region and write it to the operating-system clipboard.
 * @param ctx - Screenshot capture and clipboard provider.
 * @param signal - Cancellation for the Desktop interaction.
 * @returns Whether the user completed a non-empty selection.
 */
export async function captureScreenshotToClipboard(
  ctx: ScreenshotActionContext,
  signal: AbortSignal,
): Promise<boolean> {
  const result = await ctx.screenshot.capture({
    captureId: ScreenshotCaptureId(randomUUID()),
    mode: 'region',
    annotations: false,
  }, signal)
  if (result.kind === 'cancelled') return false
  await ctx.screenshot.copyToClipboard(result.image, signal)
  return true
}

/** Configurable default mapping supplied by the screenshot assistant. */
export interface ScreenshotInputConfig {
  readonly deviceId: string
  readonly controlId: string
}

/** Services needed to register the screenshot input contribution. */
export interface ScreenshotInputContext extends ScreenshotActionContext {
  readonly desktopInput: DesktopInput
}

/**
 * Register the screenshot action and binding.
 * @param ctx - Screenshot and Desktop input services.
 * @param config - Physical device and control selection.
 * @returns A disposer that aborts and awaits active capture work.
 */
export function registerScreenshotInput(ctx: ScreenshotInputContext, config: ScreenshotInputConfig): () => Promise<void> {
  let active: { controller: AbortController; work: Promise<void> } | undefined
  const disposeAction = ctx.desktopInput.registerAction(SCREENSHOT_COPY_ACTION, (event: InputActionEvent) => {
    if (event.gesture !== 'press' || event.phase !== 'trigger' || active !== undefined) return
    const controller = new AbortController()
    const work = captureScreenshotToClipboard(ctx, controller.signal)
      .then(() => undefined)
      .finally(() => {
        if (active?.work === work) active = undefined
      })
    active = { controller, work }
    return work
  })
  const disposeBinding = ctx.desktopInput.registerBinding({
    id: SCREENSHOT_DEFAULT_BINDING,
    deviceId: config.deviceId === '*' ? '*' : InputDeviceId(config.deviceId),
    controlId: InputControlId(config.controlId),
    gesture: 'press',
    actionId: SCREENSHOT_COPY_ACTION,
  })
  return async () => {
    disposeBinding()
    const operation = active
    operation?.controller.abort(new Error('screenshot assistant disposed'))
    if (operation !== undefined) await Promise.allSettled([operation.work])
    disposeAction()
  }
}
