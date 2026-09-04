/** DSH Agent screenshot destination using the existing Session prompt admission path. */

import { randomUUID } from 'node:crypto'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionRequestId } from '@deepseek-ai/dsh-api-session-controller'
import { ScreenshotTargetId } from '@deepseek-ai/dsh-screenshot-target'

/** Services required by the DSH Agent destination. */
export const inject = ['screenshotTargets', 'sessionController']

/** Register the built-in DSH Agent destination. */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.screenshotTargets.register({
    id: ScreenshotTargetId('dsh-agent'),
    displayName: 'DSH Agent',
    async send(request, signal): Promise<void> {
      if (request.sessionId === undefined) {
        throw new Error('the DSH Agent screenshot target requires an active Session')
      }
      await ctx.sessionController.prompt({
        requestId: randomUUID() as SessionRequestId,
        sessionId: request.sessionId,
        mode: 'queue',
        content: [
          { type: 'text', text: request.prompt },
          {
            type: 'image',
            mediaType: 'image/png',
            data: Buffer.from(request.image.data).toString('base64'),
            name: 'screenshot.png',
          },
        ],
      }, signal)
    },
  }), 'screenshot-target-dsh-agent: registration')
}
