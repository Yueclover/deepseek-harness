/** Desktop carrier argument parsing shared by source and packaged launches. */

/** Options consumed by the Electron carrier before it starts the dsh Host. */
export interface DesktopLaunchOptions {
  /** Ordered Cordis patch overlays forwarded to the desktop profile. */
  patches: string[]
  /** Source-only dsh CLI entry supplied by the repository launcher. */
  developmentCliEntry?: string
  /** Source-only Node import hook supplied by the repository launcher. */
  developmentCliImport?: string
}

function requireValue(argv: readonly string[], index: number, name: string): string {
  const value = argv[index + 1]
  if (value === undefined || value === '') throw new Error(`${name} requires a value`)
  return value
}

/**
 * Parse Desktop launcher options without accepting application arguments that
 * the owned Web Host cannot consume.
 * @param argv - Arguments after the Electron entry script.
 * @returns the ordered patch files and source-only launcher overrides.
 */
export function parseDesktopLaunchArguments(argv: readonly string[]): DesktopLaunchOptions {
  const options: DesktopLaunchOptions = { patches: [] }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv.at(index)
    if (argument === undefined) break
    if (argument === '--') continue
    if (argument === '--patch') {
      options.patches.push(requireValue(argv, index, argument))
      index += 1
      continue
    }
    if (argument.startsWith('--patch=')) {
      const value = argument.slice('--patch='.length)
      if (value === '') throw new Error('--patch requires a value')
      options.patches.push(value)
      continue
    }
    if (argument === '--dsh-cli-entry' || argument === '--dsh-cli-import') {
      const value = requireValue(argv, index, argument)
      const key = argument === '--dsh-cli-entry' ? 'developmentCliEntry' : 'developmentCliImport'
      if (options[key] !== undefined) throw new Error(`${argument} may be specified only once`)
      options[key] = value
      index += 1
      continue
    }
    throw new Error(`desktop: unknown option ${JSON.stringify(argument)}; use --patch <path> to load a temporary plugin overlay`)
  }
  return options
}
