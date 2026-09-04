/** Service Definition for interactive screenshots captured by a local Desktop shell. */

import { Context, Service } from '@deepseek-ai/cordis'
import { brandString, type Branded } from '@deepseek-ai/dsh-brand'

/** Opaque identity guarding one screenshot operation against late completion. */
export type ScreenshotCaptureId = Branded<'ScreenshotCaptureId'>

/**
 * Create a screenshot operation identity.
 * @param value - Non-empty opaque value.
 * @returns A screenshot operation identity.
 */
export function ScreenshotCaptureId(value: string): ScreenshotCaptureId {
  if (value.length === 0) throw new Error('screenshot capture id must not be empty')
  return brandString<ScreenshotCaptureId>(value)
}

/** Request for the user to select a desktop region. */
export interface ScreenshotCaptureRequest {
  captureId: ScreenshotCaptureId
  mode: 'region'
  annotations: boolean
}

/**
 * Validate a capture request received across a process boundary.
 * @param value - Untrusted process value.
 * @returns A validated capture request.
 */
export function parseScreenshotCaptureRequest(value: unknown): ScreenshotCaptureRequest {
  if (typeof value !== 'object' || value === null) throw new Error('invalid screenshot request')
  const request = value as Record<string, unknown>
  if (request.mode !== 'region' || typeof request.captureId !== 'string' || request.captureId.length === 0) {
    throw new Error('invalid screenshot request')
  }
  if (typeof request.annotations !== 'boolean') throw new Error('invalid screenshot annotations flag')
  return { captureId: ScreenshotCaptureId(request.captureId), mode: 'region', annotations: request.annotations }
}

/** Captured PNG transferred from the Desktop shell before attachment admission. */
export interface ScreenshotImage {
  mediaType: 'image/png'
  data: Uint8Array
  width: number
  height: number
}

/**
 * Validate PNG image bytes received across a process boundary.
 * @param value - Untrusted process value.
 * @returns A validated screenshot image.
 */
export function parseScreenshotImage(value: unknown): ScreenshotImage {
  if (typeof value !== 'object' || value === null) throw new Error('invalid screenshot image')
  const image = value as Record<string, unknown>
  const { width, height } = image
  if (image.mediaType !== 'image/png'
    || !(image.data instanceof Uint8Array)
    || image.data.byteLength === 0
    || typeof width !== 'number'
    || typeof height !== 'number'
    || !Number.isSafeInteger(width)
    || !Number.isSafeInteger(height)
    || width <= 0
    || height <= 0) {
    throw new Error('invalid screenshot image')
  }
  return {
    mediaType: 'image/png',
    data: image.data,
    width,
    height,
  }
}

/** Terminal result of one interactive capture. */
export type ScreenshotCaptureResult =
  | { kind: 'captured'; captureId: ScreenshotCaptureId; image: ScreenshotImage; prompt?: string }
  | { kind: 'cancelled'; captureId: ScreenshotCaptureId }

/**
 * Validate a result received across a process boundary.
 * @param value - Untrusted process value.
 * @returns A validated screenshot result.
 */
export function parseScreenshotCaptureResult(value: unknown): ScreenshotCaptureResult {
  if (typeof value !== 'object' || value === null) throw new Error('invalid screenshot result')
  const result = value as Record<string, unknown>
  if (typeof result.captureId !== 'string' || result.captureId.length === 0) throw new Error('invalid screenshot capture id')
  const captureId = ScreenshotCaptureId(result.captureId)
  if (result.kind === 'cancelled') return { kind: 'cancelled', captureId }
  if (result.kind !== 'captured' || typeof result.image !== 'object' || result.image === null) {
    throw new Error('invalid screenshot result kind')
  }
  const image = parseScreenshotImage(result.image)
  if (result.prompt !== undefined && typeof result.prompt !== 'string') throw new Error('invalid screenshot prompt')
  return {
    kind: 'captured',
    captureId,
    image,
    ...(result.prompt === undefined ? {} : { prompt: result.prompt }),
  }
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    screenshot: Screenshot
  }
}

/** Interactive screenshot capability used by Desktop inputs and other consumers. */
export abstract class Screenshot extends Service {
  constructor(ctx: Context) {
    super(ctx, 'screenshot')
  }

  /**
   * Open one capture interaction.
   * @param request - Interactive capture request.
   * @param signal - Optional cancellation signal.
   * @returns The terminal capture result.
   */
  abstract capture(request: ScreenshotCaptureRequest, signal?: AbortSignal): Promise<ScreenshotCaptureResult>

  /**
   * Write a captured PNG to the operating-system clipboard.
   * @param image - Validated captured PNG.
   * @param signal - Optional cancellation signal.
   */
  abstract copyToClipboard(image: ScreenshotImage, signal?: AbortSignal): Promise<void>
}

export default Screenshot
