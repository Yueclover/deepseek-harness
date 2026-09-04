/** Generic image, screen-capture, and clipboard messages exposed by the Desktop shell. */

/** PNG bytes returned by a trusted Desktop capability. */
export interface DesktopPngImage {
  readonly mediaType: 'image/png'
  readonly data: Uint8Array
  readonly width: number
  readonly height: number
}

/** Result of one interactive Desktop region selection. */
export type DesktopRegionCaptureResult =
  | { readonly kind: 'captured'; readonly image: DesktopPngImage }
  | { readonly kind: 'cancelled' }

/**
 * Validate PNG bytes received from another process.
 * @param value - Untrusted process value.
 * @returns A validated PNG image.
 */
export function parseDesktopPngImage(value: unknown): DesktopPngImage {
  if (typeof value !== 'object' || value === null) throw new Error('invalid Desktop PNG image')
  const image = value as Record<string, unknown>
  if (image.mediaType !== 'image/png'
    || !(image.data instanceof Uint8Array)
    || image.data.byteLength === 0
    || !Number.isSafeInteger(image.width)
    || !Number.isSafeInteger(image.height)
    || (image.width as number) <= 0
    || (image.height as number) <= 0) {
    throw new Error('invalid Desktop PNG image')
  }
  return {
    mediaType: 'image/png',
    data: image.data,
    width: image.width as number,
    height: image.height as number,
  }
}

/**
 * Validate an interactive region result received from another process.
 * @param value - Untrusted process value.
 * @returns A validated capture or cancellation result.
 */
export function parseDesktopRegionCaptureResult(value: unknown): DesktopRegionCaptureResult {
  if (typeof value !== 'object' || value === null) throw new Error('invalid Desktop region capture result')
  const result = value as Record<string, unknown>
  if (result.kind === 'cancelled') return { kind: 'cancelled' }
  if (result.kind !== 'captured') throw new Error('invalid Desktop region capture result')
  return { kind: 'captured', image: parseDesktopPngImage(result.image) }
}

declare module './protocol.ts' {
  interface DesktopBridgeRequestMap {
    'screen/capture-region': {
      request: Record<never, never>
      response: DesktopRegionCaptureResult
    }
    'clipboard/write-png': {
      request: { image: DesktopPngImage }
      response: { written: true }
    }
  }
}
