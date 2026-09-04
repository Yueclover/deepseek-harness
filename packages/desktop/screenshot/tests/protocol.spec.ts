import { describe, expect, it } from 'vitest'
import { parseScreenshotCaptureRequest, parseScreenshotCaptureResult, ScreenshotCaptureId } from '../src/index.ts'

describe('screenshot wire protocol', () => {
  it('validates capture requests', () => {
    expect(parseScreenshotCaptureRequest({ captureId: 'capture-1', mode: 'region', annotations: false }))
      .toEqual({ captureId: 'capture-1', mode: 'region', annotations: false })
    expect(() => parseScreenshotCaptureRequest({ captureId: 'capture-1', mode: 'screen', annotations: false })).toThrow()
    expect(() => parseScreenshotCaptureRequest({ captureId: 'capture-1', mode: 'region' })).toThrow()
  })
  it('accepts captured PNG bytes', () => {
    const captureId = ScreenshotCaptureId('capture-1')
    expect(parseScreenshotCaptureResult({
      kind: 'captured',
      captureId,
      image: { mediaType: 'image/png', data: new Uint8Array([1, 2]), width: 2, height: 1 },
    })).toEqual({
      kind: 'captured',
      captureId,
      image: { mediaType: 'image/png', data: new Uint8Array([1, 2]), width: 2, height: 1 },
    })
  })

  it.each([
    undefined,
    { kind: 'cancelled', captureId: '' },
    { kind: 'captured', captureId: 'capture-1', image: { mediaType: 'image/jpeg', data: new Uint8Array(), width: 1, height: 1 } },
    { kind: 'captured', captureId: 'capture-1', image: { mediaType: 'image/png', data: [], width: 1, height: 1 } },
    { kind: 'captured', captureId: 'capture-1', image: { mediaType: 'image/png', data: new Uint8Array(), width: 1, height: 1 } },
    { kind: 'captured', captureId: 'capture-1', image: { mediaType: 'image/png', data: new Uint8Array(), width: 0, height: 1 } },
  ])('rejects malformed process values', (value) => {
    expect(() => parseScreenshotCaptureResult(value)).toThrow()
  })
})
