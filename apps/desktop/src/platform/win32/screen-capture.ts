/** Windows primary-display capture and the temporary region-selection window. */

import { BrowserWindow, desktopCapturer, nativeImage, screen, type NativeImage, type Rectangle } from 'electron'

interface SelectedRegion { x: number; y: number; width: number; height: number }

/** Pixel result returned by the native region selector. */
export interface CapturedRegion { data: Uint8Array; width: number; height: number }

/**
 * Convert a logical display selection to captured-image pixels.
 * @param region - Selected logical coordinates relative to the display.
 * @param displayBounds - Logical display bounds.
 * @param imageSize - Captured image dimensions.
 * @returns A clamped integer crop rectangle, or undefined for an empty selection.
 */
export function capturedPixelRectangle(
  region: SelectedRegion,
  displayBounds: Pick<Rectangle, 'width' | 'height'>,
  imageSize: { width: number; height: number },
): Rectangle | undefined {
  if (displayBounds.width <= 0 || displayBounds.height <= 0 || imageSize.width <= 0 || imageSize.height <= 0) return undefined
  const scaleX = imageSize.width / displayBounds.width
  const scaleY = imageSize.height / displayBounds.height
  const x = Math.max(0, Math.min(imageSize.width, Math.round(region.x * scaleX)))
  const y = Math.max(0, Math.min(imageSize.height, Math.round(region.y * scaleY)))
  const right = Math.max(x, Math.min(imageSize.width, Math.round((region.x + region.width) * scaleX)))
  const bottom = Math.max(y, Math.min(imageSize.height, Math.round((region.y + region.height) * scaleY)))
  if (right === x || bottom === y) return undefined
  return { x, y, width: right - x, height: bottom - y }
}

function prepareSelectorScript(imageUrl: string): string {
  return `(async () => {
    const image = document.getElementById('screen'); const selection = document.getElementById('selection');
    image.src = ${JSON.stringify(imageUrl)}; await image.decode(); await new Promise(requestAnimationFrame);
    selection.hidden = true; selection.style.width = '0'; selection.style.height = '0'; let start;
    window.__dshSelection = new Promise(resolve => {
    const finish = value => { document.onpointermove = null; document.onpointerup = null; resolve(value); };
    document.onkeydown = event => { if (event.key === 'Escape') finish(null); };
    document.onpointerdown = event => {
      start = { x: event.clientX, y: event.clientY }; selection.hidden = false;
      selection.style.left = start.x + 'px'; selection.style.top = start.y + 'px';
      document.onpointermove = move => {
        const x = Math.min(start.x, move.clientX), y = Math.min(start.y, move.clientY);
        selection.style.left = x + 'px'; selection.style.top = y + 'px';
        selection.style.width = Math.abs(move.clientX - start.x) + 'px'; selection.style.height = Math.abs(move.clientY - start.y) + 'px';
      };
      document.onpointerup = up => finish({ x: Math.min(start.x, up.clientX), y: Math.min(start.y, up.clientY), width: Math.abs(up.clientX - start.x), height: Math.abs(up.clientY - start.y) });
    };
    });
  })()`
}

const selectorDocument = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'"><style>
html,body,#screen{margin:0;width:100%;height:100%;overflow:hidden;cursor:crosshair;user-select:none}
#screen{position:fixed;inset:0;display:block;object-fit:fill}#shade{position:fixed;inset:0;background:rgba(0,0,0,.18)}
#selection{position:fixed;border:1px solid #fff;box-shadow:0 0 0 99999px rgba(0,0,0,.35);pointer-events:none}
</style></head><body><img id="screen" draggable="false"><div id="shade"></div><div id="selection" hidden></div></body></html>`

let selectorWindow: BrowserWindow | undefined
let selectorReady: Promise<BrowserWindow> | undefined

async function getSelectorWindow(bounds: Rectangle): Promise<BrowserWindow> {
  if (selectorWindow !== undefined && !selectorWindow.isDestroyed()) {
    selectorWindow.setBounds(bounds, false)
    return selectorWindow
  }
  if (selectorReady !== undefined) return selectorReady
  const overlay = new BrowserWindow({
    ...bounds,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  overlay.setAlwaysOnTop(true, 'screen-saver')
  const ready = overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(selectorDocument)}`)
    .then(() => {
      overlay.setBounds(bounds, false)
      selectorWindow = overlay
      return overlay
    })
    .finally(() => {
      if (selectorReady === ready) selectorReady = undefined
    })
  selectorReady = ready
  return ready
}

/**
 * Prepare the hidden primary-display selector before the first capture request.
 * @returns Completion after the selector document is ready.
 */
export async function preparePrimaryDisplayRegionCapture(): Promise<void> {
  await getSelectorWindow(screen.getPrimaryDisplay().bounds)
}

/**
 * Dispose the reusable selector window during Desktop shutdown.
 * @returns Completion after pending preparation and window destruction.
 */
export async function disposePrimaryDisplayRegionCapture(): Promise<void> {
  await selectorReady
  const overlay = selectorWindow
  selectorWindow = undefined
  if (overlay !== undefined && !overlay.isDestroyed()) overlay.destroy()
}

async function selectRegion(image: NativeImage, bounds: Rectangle, signal: AbortSignal): Promise<SelectedRegion | undefined> {
  signal.throwIfAborted()
  const overlay = await getSelectorWindow(bounds)
  const onAbort = (): void => { overlay.hide() }
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    await overlay.webContents.executeJavaScript(prepareSelectorScript(image.toDataURL()), true)
    signal.throwIfAborted()
    overlay.setBounds(bounds, false)
    overlay.show()
    overlay.focus()
    const selected = await overlay.webContents.executeJavaScript('window.__dshSelection', true) as SelectedRegion | null
    signal.throwIfAborted()
    return selected ?? undefined
  } finally {
    signal.removeEventListener('abort', onAbort)
    if (!overlay.isDestroyed()) overlay.hide()
  }
}

/**
 * Capture an interactively selected region of the primary display.
 * @param signal - Cancellation signal that closes the selection overlay.
 * @returns PNG bytes and pixel dimensions, or undefined when the user cancels.
 */
export async function capturePrimaryDisplayRegion(signal: AbortSignal): Promise<CapturedRegion | undefined> {
  signal.throwIfAborted()
  const display = screen.getPrimaryDisplay()
  const thumbnailSize = {
    width: Math.max(1, Math.round(display.bounds.width * display.scaleFactor)),
    height: Math.max(1, Math.round(display.bounds.height * display.scaleFactor)),
  }
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize, fetchWindowIcons: false })
  const source = sources.find(candidate => candidate.display_id === String(display.id)) ?? (sources.length === 1 ? sources[0] : undefined)
  if (source === undefined || source.thumbnail.isEmpty()) throw new Error('primary display capture source is unavailable')
  const region = await selectRegion(source.thumbnail, display.bounds, signal)
  if (region === undefined) return undefined
  const crop = capturedPixelRectangle(region, display.bounds, source.thumbnail.getSize())
  if (crop === undefined) return undefined
  const image = nativeImage.createFromBuffer(source.thumbnail.crop(crop).toPNG())
  if (image.isEmpty()) throw new Error('selected screenshot region is empty')
  const size = image.getSize()
  return { data: image.toPNG(), width: size.width, height: size.height }
}
