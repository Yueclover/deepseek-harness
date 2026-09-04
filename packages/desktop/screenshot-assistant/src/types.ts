/** Browser-safe screenshot assistant request and receipt types. */

import type { SessionId } from '@deepseek-ai/dsh-session/types'

/** User request binding one capture to one exact Desktop Session. */
export interface ScreenshotAssistantRequest {
  readonly sessionId: SessionId
  readonly prompt: string
  readonly annotations: boolean
}

/** Terminal receipt for a screenshot interaction. */
export type ScreenshotAssistantReceipt = { readonly accepted: true } | { readonly accepted: false; readonly reason: 'cancelled' }
