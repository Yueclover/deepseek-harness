import { describe, expect, it } from 'vitest'
import { capturedPixelRectangle } from '../../../src/platform/win32/screen-capture.ts'

describe('capturedPixelRectangle', () => {
  it('maps logical selection coordinates through display scaling', () => {
    expect(capturedPixelRectangle(
      { x: 10, y: 20, width: 100, height: 50 },
      { width: 1000, height: 500 },
      { width: 2000, height: 1000 },
    )).toEqual({ x: 20, y: 40, width: 200, height: 100 })
  })

  it('clamps the selection and rejects an empty crop', () => {
    expect(capturedPixelRectangle(
      { x: -10, y: -10, width: 30, height: 30 },
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    )).toEqual({ x: 0, y: 0, width: 20, height: 20 })
    expect(capturedPixelRectangle(
      { x: 1, y: 1, width: 0, height: 0 },
      { width: 100, height: 100 },
      { width: 100, height: 100 },
    )).toBeUndefined()
  })
})
