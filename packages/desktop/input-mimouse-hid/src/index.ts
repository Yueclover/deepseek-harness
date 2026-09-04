/** MiMouse private-HID provider for the shared device-neutral mouse service. */

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { devicesAsync, HID, type Device } from 'node-hid'
import {
  InputControlId,
  InputDeviceId,
  type InputDeviceId as InputDeviceIdType,
} from '@deepseek-ai/dsh-desktop-input'

const PRIVATE_USAGE = 0xff12
const SCREENSHOT_KEY_DOWN = 0x32
const SCREENSHOT_KEY_UP = 0x41
const KEY_COMMAND = 0x9f
const NORMAL_REPORT = 0x05
const DATA_HEAD = 0xfe
const DATA_TYPE = 0xc0
const DATA_TAIL = 0xef
const CHANNEL_HEAD = 0xff
const HID_CHANNEL = 0xf1
const MIMOUSE_VENDOR_IDS = new Set([0x248a, 0x248b, 0x248c, 0x1d8d, 0x2d8d, 0x3d8d, 0x4d8d, 0x6d8c, 0x6d8d])

/** Provider configuration. */
export interface Config {
  /** Milliseconds between HID enumeration passes used for hot-plug discovery. */
  scanIntervalMs: number
}

/** Validated provider configuration. */
export const Config: z<Config> = z.object({ scanIntervalMs: z.number().min(250).default(2_000) })

/** Required shared mouse event service. */
export const inject = ['desktopInput']

/** Minimal native handle used by the provider and its tests. */
export interface MimouseHidHandle {
  on(event: 'data', listener: (data: Buffer) => void): this
  on(event: 'error', listener: (error: Error) => void): this
  close(): void
}

/** Injectable native HID operations. */
export interface MimouseHidApi {
  devices(): Promise<Device[]>
  open(path: string): MimouseHidHandle
}

const nativeHidApi: MimouseHidApi = { devices: devicesAsync, open: path => new HID(path) }

/**
 * Return whether a HID collection uses the known MiMouse private protocol.
 * @param device - Native HID enumeration record.
 * @returns Whether this provider can open the collection.
 */
export function isMimousePrivateInterface(device: Device): boolean {
  return device.path !== undefined
    && MIMOUSE_VENDOR_IDS.has(device.vendorId)
    && device.usagePage === PRIVATE_USAGE
    && device.usage === PRIVATE_USAGE
}

/**
 * Decode the known screenshot control while leaving other controls to later protocol fixtures.
 * @param report - Raw HID input report.
 * @returns The normalized screenshot control event, or `undefined` for an unknown report.
 */
export function decodeMimouseButtonReport(report: Uint8Array): { controlId: 'mimouse.screenshot'; pressed: boolean } | undefined {
  if (report[0] !== NORMAL_REPORT) return undefined
  let index = 1
  if (report[index] === CHANNEL_HEAD) {
    if (report[index + 1] !== HID_CHANNEL || report[index + 2] !== DATA_HEAD) return undefined
    index += 3
  } else if (report[index] === DATA_HEAD) {
    index += 1
  } else {
    return undefined
  }
  if (report[index++] !== DATA_TYPE || report[index++] !== KEY_COMMAND || report[index++] !== 1) return undefined
  const key = report[index++]
  if (report[index] !== DATA_TAIL) return undefined
  if (key === SCREENSHOT_KEY_DOWN) return { controlId: 'mimouse.screenshot', pressed: true }
  if (key === SCREENSHOT_KEY_UP) return { controlId: 'mimouse.screenshot', pressed: false }
  return undefined
}

/** Own hot-plug discovery and normalize known reports without selecting business actions. */
export class MimouseDeviceProvider {
  private readonly handles = new Map<string, { handle: MimouseHidHandle; deviceId: InputDeviceIdType }>()
  private scanTimer: NodeJS.Timeout | undefined
  private scanWork: Promise<void> | undefined
  private disposed = false

  constructor(
    private readonly ctx: Context,
    private readonly hid: MimouseHidApi = nativeHidApi,
    private readonly scanIntervalMs = 2_000,
  ) {}

  /** Start discovery immediately and continue polling for device changes. */
  start(): void {
    if (this.scanTimer !== undefined || this.disposed) return
    void this.refresh()
    this.scanTimer = setInterval(() => { void this.refresh() }, this.scanIntervalMs)
  }

  /** Run or join one discovery pass. */
  refresh(): Promise<void> {
    if (this.disposed) return Promise.resolve()
    if (this.scanWork !== undefined) return this.scanWork
    const work = this.scan().catch((error: unknown) => { this.ctx.logger.warn(error) }).finally(() => {
      if (this.scanWork === work) this.scanWork = undefined
    })
    this.scanWork = work
    return work
  }

  private async scan(): Promise<void> {
    const devices = (await this.hid.devices()).filter(isMimousePrivateInterface)
    const available = new Map(devices.flatMap(device => device.path === undefined ? [] : [[device.path, device] as const]))
    for (const path of this.handles.keys()) if (!available.has(path)) this.close(path)
    for (const [path, device] of available) if (!this.handles.has(path)) this.open(path, device)
  }

  private open(path: string, device: Device): void {
    try {
      const handle = this.hid.open(path)
      const identity = device.serialNumber?.trim() || path
      const deviceId = InputDeviceId(`mimouse:${device.vendorId.toString(16)}:${device.productId.toString(16)}:${identity}`)
      this.handles.set(path, { handle, deviceId })
      handle.on('data', (data) => {
        const decoded = decodeMimouseButtonReport(data)
        if (decoded === undefined) return
        this.ctx.desktopInput.publish({
          type: 'button',
          deviceId,
          controlId: InputControlId(decoded.controlId),
          pressed: decoded.pressed,
        })
      })
      handle.on('error', (error) => {
        this.ctx.logger.warn(error)
        this.close(path)
      })
    } catch (error) {
      this.ctx.logger.warn(error)
    }
  }

  private close(path: string): void {
    const opened = this.handles.get(path)
    if (opened === undefined) return
    this.handles.delete(path)
    try { opened.handle.close() } catch (error) { this.ctx.logger.warn(error) }
    this.ctx.desktopInput.publish({ type: 'disconnected', deviceId: opened.deviceId })
  }

  /** Stop discovery and release all native handles. */
  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    if (this.scanTimer !== undefined) clearInterval(this.scanTimer)
    this.scanTimer = undefined
    await this.scanWork
    for (const path of [...this.handles.keys()]) this.close(path)
  }
}

/** Install the Windows x64 MiMouse provider for the plugin lifetime. */
export function apply(ctx: Context, config: Config): void {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('MiMouse HID provider currently supports Windows x64 only')
  }
  ctx.effect(() => {
    const provider = new MimouseDeviceProvider(ctx, nativeHidApi, config.scanIntervalMs)
    provider.start()
    return () => provider.dispose()
  }, 'mouse-device-mi-hid: provider')
}
