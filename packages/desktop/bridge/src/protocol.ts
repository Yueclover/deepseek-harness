/** Process-safe frame definitions for the Desktop Bridge. */

import type { Branded } from '@deepseek-ai/dsh-brand'

/** Opaque identity of one bridge request. */
export type DesktopBridgeRequestId = Branded<'DesktopBridgeRequestId'>

/** Requests contributed by Desktop plugins through declaration merging. */
export interface DesktopBridgeRequestMap {}

/** Events contributed by Desktop plugins through declaration merging. */
export interface DesktopBridgeEventMap {}

/** One request definition in {@link DesktopBridgeRequestMap}. */
export interface DesktopBridgeRequestDefinition<Request = unknown, Response = unknown> {
  request: Request
  response: Response
}

/** Request names registered by the active Desktop plugin set. */
export type DesktopBridgeRequestName = Extract<keyof DesktopBridgeRequestMap, string>

/** Event names registered by the active Desktop plugin set. */
export type DesktopBridgeEventName = Extract<keyof DesktopBridgeEventMap, string>

/** Serializable failure returned by the remote endpoint. */
export interface DesktopBridgeFailure {
  code: string
  message: string
}

/** Process frame shared by every Desktop capability. */
export type DesktopBridgeFrame =
  | { type: 'request'; requestId: DesktopBridgeRequestId; method: string; payload: unknown }
  | { type: 'response'; requestId: DesktopBridgeRequestId; result: unknown }
  | { type: 'error'; requestId: DesktopBridgeRequestId; error: DesktopBridgeFailure }
  | { type: 'cancel'; requestId: DesktopBridgeRequestId }
  | { type: 'event'; event: string; payload: unknown }

/**
 * Test an untrusted process message.
 * @param value - Untrusted process message.
 * @returns Whether the value is a Desktop Bridge frame.
 */
export function isDesktopBridgeFrame(value: unknown): value is DesktopBridgeFrame {
  if (typeof value !== 'object' || value === null) return false
  const frame = value as Record<string, unknown>
  if (typeof frame.type !== 'string') return false
  if (frame.type === 'request') {
    return typeof frame.requestId === 'string' && typeof frame.method === 'string' && 'payload' in frame
  }
  if (frame.type === 'response') return typeof frame.requestId === 'string' && 'result' in frame
  if (frame.type === 'cancel') return typeof frame.requestId === 'string'
  if (frame.type === 'event') return typeof frame.event === 'string' && 'payload' in frame
  if (frame.type !== 'error' || typeof frame.requestId !== 'string') return false
  if (typeof frame.error !== 'object' || frame.error === null) return false
  const error = frame.error as Record<string, unknown>
  return typeof error.code === 'string' && typeof error.message === 'string'
}
