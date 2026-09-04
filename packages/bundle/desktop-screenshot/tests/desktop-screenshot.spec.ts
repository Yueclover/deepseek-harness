/** Published screenshot bundle metadata and patch-list composition. */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { entryListSchema } from '@deepseek-ai/cordis-plugin-include'
import * as yaml from 'js-yaml'
import { describe, expect, it } from 'vitest'

describe('desktop screenshot bundle', () => {
  it('exports one parseable install layer with the complete feature graph', () => {
    const root = fileURLToPath(new URL('..', import.meta.url))
    const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      dsh?: { bundle?: { patch?: string } }
    }
    expect(manifest.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    const parsed = yaml.load(
      readFileSync(resolve(root, manifest.dsh!.bundle!.patch!), 'utf8'),
      { schema: entryListSchema },
    )
    if (!Array.isArray(parsed)) throw new TypeError('desktop screenshot patch must be a patch list')
    const rows = parsed.flatMap((patch): Record<string, unknown>[] =>
      typeof patch === 'object' && patch !== null
        ? (patch as { insert?: Record<string, unknown>[] }).insert ?? []
        : [],
    )
    expect(rows.map(row => row.id)).toEqual([
      'desktop-input',
      'desktop-input-mimouse-hid',
      'desktop-bridge',
      'screenshot',
      'screenshot-targets',
      'screenshot-target-dsh-agent',
      'screenshot-assistant',
      'screenshot-ui',
    ])
    expect(rows.find(row => row.id === 'screenshot-assistant')?.config).toEqual({
      defaultTargetId: 'dsh-agent',
      inputDeviceId: '*',
      inputControlId: 'mimouse.screenshot',
    })
    expect(manifest.dependencies).toHaveProperty('@deepseek-ai/dsh-desktop-input')
    expect(manifest.dependencies).toHaveProperty('@deepseek-ai/dsh-client-ui-screenshot')
  })
})
