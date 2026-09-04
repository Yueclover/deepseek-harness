import { describe, expect, it, vi } from 'vitest'
import { DesktopBridgeEndpoint, type DesktopBridgeFrame, type DesktopBridgeTransport } from '@deepseek-ai/dsh-desktop-bridge'
import { registerDesktopCapabilities } from '../src/desktop-capabilities.ts'

const electron = vi.hoisted(() => ({ write: vi.fn(async () => {}) }))
vi.mock('electron', () => ({
  ClipboardItem: class { constructor(readonly items: unknown) {} },
  clipboard: { write: electron.write },
  desktopCapturer: {},
  nativeImage: {},
  screen: {},
}))

function endpoints(): [DesktopBridgeEndpoint, DesktopBridgeEndpoint] {
  let leftListener: (message: unknown) => void = () => {}
  let rightListener: (message: unknown) => void = () => {}
  const left: DesktopBridgeTransport = {
    send: (frame: DesktopBridgeFrame) => { queueMicrotask(() => { rightListener(frame) }) },
    subscribe: (listener) => { leftListener = listener; return () => { leftListener = () => {} } },
  }
  const right: DesktopBridgeTransport = {
    send: (frame: DesktopBridgeFrame) => { queueMicrotask(() => { leftListener(frame) }) },
    subscribe: (listener) => { rightListener = listener; return () => { rightListener = () => {} } },
  }
  return [new DesktopBridgeEndpoint(left), new DesktopBridgeEndpoint(right)]
}

describe('Desktop capabilities', () => {
  it('returns PNG capture data and becomes unavailable after disposal', async () => {
    const [host, desktop] = endpoints()
    const capture = vi.fn(async () => ({ data: new Uint8Array([1, 2]), width: 2, height: 1 }))
    const dispose = registerDesktopCapabilities(desktop, capture)
    await expect(host.request('screen/capture-region', {}))
      .resolves.toEqual({ kind: 'captured', image: { mediaType: 'image/png', data: new Uint8Array([1, 2]), width: 2, height: 1 } })
    await expect(host.request('clipboard/write-png', {
      image: { mediaType: 'image/png', data: new Uint8Array([1, 2]), width: 2, height: 1 },
    })).resolves.toEqual({ written: true })
    expect(electron.write).toHaveBeenCalledOnce()
    dispose()
    await expect(host.request('screen/capture-region', {}))
      .rejects.toMatchObject({ code: 'method-unavailable' })
    await Promise.all([host.dispose(), desktop.dispose()])
  })

  it('returns explicit cancellation', async () => {
    const [host, desktop] = endpoints()
    const dispose = registerDesktopCapabilities(desktop, async () => undefined)
    await expect(host.request('screen/capture-region', {})).resolves.toEqual({ kind: 'cancelled' })
    dispose()
    await Promise.all([host.dispose(), desktop.dispose()])
  })
})
