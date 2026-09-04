/** Registry of screenshot destinations selected by user settings. */

import { Context, Service } from '@deepseek-ai/cordis'
import { brandString, type Branded } from '@deepseek-ai/dsh-brand'
import type { ScreenshotImage } from '@deepseek-ai/dsh-screenshot'
import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** Opaque identifier persisted by the screenshot assistant settings namespace. */
export type ScreenshotTargetId = Branded<'ScreenshotTargetId'>

/**
 * Validate and brand one screenshot target identifier.
 * @param value - Candidate target id.
 * @returns The branded target id.
 */
export function ScreenshotTargetId(value: string): ScreenshotTargetId {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) throw new Error(`invalid screenshot target id: ${value}`)
  return brandString<ScreenshotTargetId>(value)
}

/** Screenshot payload delivered after the Desktop interaction completes. */
export interface ScreenshotTargetRequest {
  readonly image: ScreenshotImage
  readonly prompt: string
  readonly sessionId?: SessionId
  readonly source: 'composer' | 'hardware' | 'shortcut'
}

/** One independently installable screenshot destination. */
export interface ScreenshotTarget {
  readonly id: ScreenshotTargetId
  readonly displayName: string
  send(request: ScreenshotTargetRequest, signal: AbortSignal): Promise<void>
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    screenshotTargets: ScreenshotTargets
  }
}

/** Live registry used by the assistant and its settings page. */
export default class ScreenshotTargets extends Service {
  private readonly targets = new Map<ScreenshotTargetId, ScreenshotTarget>()

  constructor(ctx: Context) {
    super(ctx, 'screenshotTargets')
  }

  /**
   * Register one target until the returned disposer runs.
   * @param target - Named screenshot destination.
   * @returns The idempotent registration disposer.
   */
  register(target: ScreenshotTarget): () => void {
    if (this.targets.has(target.id)) throw new Error(`screenshot target already registered: ${target.id}`)
    this.targets.set(target.id, target)
    return () => {
      if (this.targets.get(target.id) === target) this.targets.delete(target.id)
    }
  }

  /**
   * Return the installed targets in registration order.
   * @returns Target ids and display names.
   */
  list(): readonly Pick<ScreenshotTarget, 'id' | 'displayName'>[] {
    return [...this.targets.values()].map(({ id, displayName }) => ({ id, displayName }))
  }

  /**
   * Deliver to the exact configured target without silently selecting another provider.
   * @param id - Exact configured target id.
   * @param request - Captured image and delivery context.
   * @param signal - Delivery cancellation signal.
   */
  async send(id: ScreenshotTargetId, request: ScreenshotTargetRequest, signal: AbortSignal): Promise<void> {
    const target = this.targets.get(id)
    if (target === undefined) throw new Error(`configured screenshot target is unavailable: ${id}`)
    await target.send(request, signal)
  }
}
