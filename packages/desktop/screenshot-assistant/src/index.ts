/** Screenshot capture orchestration with a user-selected delivery target. */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-desktop-input'
import { ScreenshotCaptureId, type Screenshot } from '@deepseek-ai/dsh-screenshot'
import { ScreenshotTargetId, type default as ScreenshotTargets } from '@deepseek-ai/dsh-screenshot-target'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { ScreenshotAssistantReceipt, ScreenshotAssistantRequest } from './types.ts'
import { registerScreenshotInput } from './action.ts'

export type * from './types.ts'
export { captureScreenshotToClipboard, registerScreenshotInput } from './action.ts'

/** Settings namespace owned by the screenshot assistant. */
export const SCREENSHOT_ASSISTANT_SETTINGS_NAMESPACE = 'screenshot-assistant'

/** Built-in target installed by the default bundle. */
export const DEFAULT_SCREENSHOT_TARGET = 'dsh-agent'

/** User-editable screenshot assistant settings. */
export interface ScreenshotAssistantSettings {
  targetId: string
}

/** Plugin composition config used as the settings base layer. */
export interface Config {
  /** Initial target id used until the user saves a target setting. */
  defaultTargetId: string
  /** Provider-owned device id, or `*` to accept the control from every device. */
  inputDeviceId: string
  /** Normalized physical control id bound to the screenshot action. */
  inputControlId: string
}

/** Narrow dependencies used by one capture-and-delivery operation. */
export interface ScreenshotAssistantContext {
  readonly screenshot: Screenshot
  readonly screenshotTargets: ScreenshotTargets
}

/**
 * Capture and deliver one screenshot to an exact configured target.
 * @param ctx - Screenshot and target services.
 * @param request - Session binding, prompt, and annotation choice.
 * @param targetId - Exact installed target selected by settings.
 * @param signal - Cancellation for capture and delivery.
 * @returns Whether delivery completed or the user cancelled capture.
 */
export async function captureScreenshotAssistant(
  ctx: ScreenshotAssistantContext,
  request: ScreenshotAssistantRequest,
  targetId: ScreenshotTargetId,
  signal: AbortSignal,
): Promise<ScreenshotAssistantReceipt> {
  if (request.prompt.trim() === '') throw new Error('screenshot assistant prompt must not be empty')
  const result = await ctx.screenshot.capture({
    captureId: ScreenshotCaptureId(randomUUID()),
    mode: 'region',
    annotations: request.annotations,
  }, signal)
  if (result.kind === 'cancelled') return { accepted: false, reason: 'cancelled' }
  await ctx.screenshotTargets.send(targetId, {
    image: result.image,
    prompt: result.prompt?.trim() || request.prompt,
    sessionId: request.sessionId,
    source: 'composer',
  }, signal)
  return { accepted: true }
}

/** Desktop-only Remote that reads the live target setting for every capture. */
export default class ScreenshotAssistant extends TypertRemoteService {
  static inject = ['desktopInput', 'screenshot', 'screenshotTargets', 'settings', 'typert']
  static Config: z<Config> = z.object({
    defaultTargetId: z.string().default(DEFAULT_SCREENSHOT_TARGET),
    inputDeviceId: z.string().default('*'),
    inputControlId: z.string().default('mimouse.screenshot'),
  })

  private readonly settings: { get(): ScreenshotAssistantSettings }

  constructor(ctx: Context, config: Config) {
    super(ctx, 'screenshotAssistant', { namespace: 'screenshotAssistant' })
    this.settings = ctx.settings.register(
      SCREENSHOT_ASSISTANT_SETTINGS_NAMESPACE,
      z.object({ targetId: z.string().default(DEFAULT_SCREENSHOT_TARGET) }),
      {
        base: { targetId: config.defaultTargetId },
        validate: (value) => { ScreenshotTargetId(value.targetId) },
      },
    )
    ctx.effect(() => registerScreenshotInput(ctx, {
      deviceId: config.inputDeviceId,
      controlId: config.inputControlId,
    }), 'screenshot-assistant: input contribution')
  }

  /**
   * Capture a region and submit it to one Session.
   * @param request - Explicit Session binding and prompt.
   * @param signal - Remote-call cancellation.
   * @returns Whether the prompt was accepted or capture was cancelled.
   */
  @Remote('capture')
  capture(request: ScreenshotAssistantRequest, signal: AbortSignal): Promise<ScreenshotAssistantReceipt> {
    return captureScreenshotAssistant(
      this.ctx,
      request,
      ScreenshotTargetId(this.settings.get().targetId),
      signal,
    )
  }
}
