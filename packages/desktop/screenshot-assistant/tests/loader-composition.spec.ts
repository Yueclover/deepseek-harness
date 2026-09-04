/** Screenshot hardware action through the same Loader path used by a profile. */

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context, Service } from '@deepseek-ai/cordis'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import DesktopInput, { InputControlId, InputDeviceId } from '@deepseek-ai/dsh-desktop-input'
import SettingsProvider, { type SettingsNamespace } from '@deepseek-ai/dsh-settings'
import Screenshot, {
  type ScreenshotCaptureRequest,
  type ScreenshotCaptureResult,
  type ScreenshotImage,
} from '@deepseek-ai/dsh-screenshot'
import ScreenshotTargets from '@deepseek-ai/dsh-screenshot-target'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScreenshotAssistant from '../src/index.ts'

let root: string | undefined
let context: Context | undefined

class MemorySettings extends SettingsProvider {
  readonly writable = true

  protected load(): Promise<Record<string, unknown>> {
    return Promise.resolve({})
  }

  protected persist(_namespace: SettingsNamespace, _section: Record<string, unknown>): Promise<void> {
    return Promise.resolve()
  }
}

class TestTypert extends Service {
  constructor(ctx: Context) {
    super(ctx, 'typert')
  }
}

class TestScreenshot extends Screenshot {
  static captures = 0
  static clipboardWrites = 0

  capture(request: ScreenshotCaptureRequest): Promise<ScreenshotCaptureResult> {
    TestScreenshot.captures += 1
    return Promise.resolve({
      kind: 'captured',
      captureId: request.captureId,
      image: { mediaType: 'image/png', data: Uint8Array.of(1), width: 1, height: 1 },
    })
  }

  copyToClipboard(_image: ScreenshotImage): Promise<void> {
    TestScreenshot.clipboardWrites += 1
    return Promise.resolve()
  }
}

afterEach(async () => {
  await context?.fiber.dispose()
  context = undefined
  if (root !== undefined) await rm(root, { recursive: true, force: true })
  root = undefined
  TestScreenshot.captures = 0
  TestScreenshot.clipboardWrites = 0
})

describe('screenshot assistant Loader composition', () => {
  it('loads dependencies and dispatches the contributed hardware binding', async () => {
    root = await mkdtemp(join(tmpdir(), 'dsh-screenshot-assistant-loader-'))
    const configPath = join(root, 'cordis.yml')
    await writeFile(configPath, [
      "- name: '@test/desktop-input'",
      "- name: '@test/settings'",
      "- name: '@test/typert'",
      "- name: '@test/screenshot'",
      "- name: '@test/screenshot-targets'",
      "- name: '@test/screenshot-assistant'",
      '  config:',
      '    defaultTargetId: dsh-agent',
      "    inputDeviceId: '*'",
      '    inputControlId: mimouse.screenshot',
      '',
    ].join('\n'))

    const ctx = new Context()
    context = ctx
    ctx.baseUrl = pathToFileURL(root).href + '/'
    await ctx.plugin(Loader)
    ctx.loader.builtins.include = Include
    const modules = new Map<string, unknown>([
      ['@test/desktop-input', DesktopInput],
      ['@test/settings', MemorySettings],
      ['@test/typert', TestTypert],
      ['@test/screenshot', TestScreenshot],
      ['@test/screenshot-targets', ScreenshotTargets],
      ['@test/screenshot-assistant', ScreenshotAssistant],
    ])
    ctx.loader.internal = {
      version: 'v2',
      async import(specifier: string) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    } as unknown as NonNullable<typeof ctx.loader.internal>
    await ctx.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await ctx.loader.await()

    const unloaded = [...ctx.loader.entries()]
      .filter(entry => entry.fiber === undefined && !entry.disabled)
      .map(entry => entry.options.name)
    expect(unloaded).toEqual([])
    const deviceId = InputDeviceId('mimouse:test')
    const controlId = InputControlId('mimouse.screenshot')
    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: true })
    ctx.desktopInput.publish({ type: 'button', deviceId, controlId, pressed: false })

    await vi.waitFor(() => {
      expect(TestScreenshot.captures).toBe(1)
      expect(TestScreenshot.clipboardWrites).toBe(1)
    })
  })
})
