/** Electron-main registration of generic screen and clipboard capabilities. */

import {
  parseDesktopPngImage,
  type DesktopBridgeEndpoint,
  type DesktopRegionCaptureResult,
} from '@deepseek-ai/dsh-desktop-bridge'
import { clipboard, ClipboardItem } from 'electron'
import { capturePrimaryDisplayRegion, type CapturedRegion } from './platform/win32/screen-capture.ts'

/** Capture implementation injected by tests and future multi-display providers. */
export type RegionCapture = (signal: AbortSignal) => Promise<CapturedRegion | undefined>

/**
 * Register process-owned Desktop handlers without creating a second plugin system.
 * @param bridge - Parent endpoint connected to the DSH Host.
 * @param capture - Native interactive region implementation.
 * @returns A disposer for every registered handler.
 */
export function registerDesktopCapabilities(
  bridge: DesktopBridgeEndpoint,
  capture: RegionCapture = capturePrimaryDisplayRegion,
): () => void {
  const disposeCapture = bridge.handle('screen/capture-region', async (_payload, signal): Promise<DesktopRegionCaptureResult> => {
    const image = await capture(signal)
    if (image === undefined) return { kind: 'cancelled' }
    return { kind: 'captured', image: { mediaType: 'image/png', ...image } }
  })
  const disposeClipboard = bridge.handle('clipboard/write-png', async (payload) => {
    const image = parseDesktopPngImage(payload.image)
    const png = new Blob([Uint8Array.from(image.data)], { type: image.mediaType })
    await clipboard.write([new ClipboardItem({ [image.mediaType]: png })])
    return { written: true as const }
  })
  return () => {
    disposeClipboard()
    disposeCapture()
  }
}
