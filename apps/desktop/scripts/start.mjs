import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import electron from 'electron'

const main = fileURLToPath(new URL('../lib/main.js', import.meta.url))
const sourceCli = fileURLToPath(new URL('../../cli/src/bin.ts', import.meta.url))
const { ELECTRON_RUN_AS_NODE: ignoredElectronMode, ...environment } = process.env
void ignoredElectronMode

const child = spawn(electron, [
  main,
  '--dsh-cli-entry', sourceCli,
  '--dsh-cli-import', 'tsx/esm',
  ...process.argv.slice(2),
], {
  cwd: process.env.INIT_CWD ?? process.cwd(),
  env: environment,
  stdio: 'inherit',
  windowsHide: false,
})

child.once('error', (error) => {
  console.error(error)
  process.exitCode = 1
})

child.once('exit', (code) => {
  process.exitCode = code ?? 1
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    child.kill(signal)
  })
}
