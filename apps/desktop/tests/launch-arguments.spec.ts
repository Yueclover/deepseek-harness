import { describe, expect, it } from 'vitest'
import { parseDesktopLaunchArguments } from '../src/launch-arguments.ts'

describe('desktop launch arguments', () => {
  it('loads no temporary patch by default', () => {
    expect(parseDesktopLaunchArguments([])).toEqual({ patches: [] })
  })

  it('preserves repeated patch overlays and source launcher options', () => {
    expect(parseDesktopLaunchArguments([
      '--dsh-cli-entry', 'cli.ts',
      '--dsh-cli-import', 'tsx/esm',
      '--',
      '--patch', 'first.yml',
      '--patch=second.yml',
    ])).toEqual({
      patches: ['first.yml', 'second.yml'],
      developmentCliEntry: 'cli.ts',
      developmentCliImport: 'tsx/esm',
    })
  })

  it('rejects missing values and unknown Desktop options', () => {
    expect(() => parseDesktopLaunchArguments(['--patch'])).toThrow('--patch requires a value')
    expect(() => parseDesktopLaunchArguments(['--unknown'])).toThrow('use --patch <path>')
  })
})
