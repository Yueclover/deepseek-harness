import { describe, expect, it } from 'vitest'
import { decodeMimouseButtonReport, isMimousePrivateInterface } from '../src/index.ts'

const device = {
  vendorId: 0x248a,
  productId: 0x8271,
  path: 'mimouse-private-interface',
  release: 1,
  interface: -1,
  usagePage: 0xff12,
  usage: 0xff12,
}

describe('MiMouse HID protocol', () => {
  it('recognizes the known private collection and screenshot reports', () => {
    expect(isMimousePrivateInterface(device)).toBe(true)
    expect(decodeMimouseButtonReport(Uint8Array.from([0x05, 0xfe, 0xc0, 0x9f, 1, 0x32, 0xef])))
      .toEqual({ controlId: 'mimouse.screenshot', pressed: true })
    expect(decodeMimouseButtonReport(Uint8Array.from([0x05, 0xff, 0xf1, 0xfe, 0xc0, 0x9f, 1, 0x41, 0xef])))
      .toEqual({ controlId: 'mimouse.screenshot', pressed: false })
  })
})
