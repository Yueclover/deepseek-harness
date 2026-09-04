/** Desktop Bridge implementation of the screenshot capture service. */

import Screenshot from '@deepseek-ai/dsh-screenshot'
import { parseScreenshotCaptureResult, type ScreenshotCaptureRequest, type ScreenshotCaptureResult, type ScreenshotImage } from '@deepseek-ai/dsh-screenshot'
import { parseDesktopRegionCaptureResult } from '@deepseek-ai/dsh-desktop-bridge'

/** Forward screenshot operations to the Desktop shell attached to this Host. */
export default class DesktopScreenshot extends Screenshot {
  static inject = ['desktopBridge']

  /** Request an interactive region capture from the Desktop shell. */
  async capture(request: ScreenshotCaptureRequest, signal?: AbortSignal): Promise<ScreenshotCaptureResult> {
    if (request.annotations) throw new Error('screenshot annotations are not available')
    const result = parseDesktopRegionCaptureResult(
      await this.ctx.desktopBridge.request('screen/capture-region', {}, signal),
    )
    return parseScreenshotCaptureResult(result.kind === 'cancelled'
      ? { kind: 'cancelled', captureId: request.captureId }
      : { kind: 'captured', captureId: request.captureId, image: result.image })
  }

  /** Write a captured PNG through the attached Desktop shell. */
  async copyToClipboard(image: ScreenshotImage, signal?: AbortSignal): Promise<void> {
    await this.ctx.desktopBridge.request('clipboard/write-png', { image }, signal)
  }
}
