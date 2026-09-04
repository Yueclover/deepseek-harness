/** Utilities shared by the Electron desktop carrier. */

export { findWebUrl } from './server-output.ts'
export { registerDesktopCapabilities } from './desktop-capabilities.ts'
export type { RegionCapture } from './desktop-capabilities.ts'
export { capturedPixelRectangle, capturePrimaryDisplayRegion } from './platform/win32/screen-capture.ts'
export type { CapturedRegion } from './platform/win32/screen-capture.ts'
