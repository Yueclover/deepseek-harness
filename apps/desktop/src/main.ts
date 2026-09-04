/** Electron carrier that owns a dsh web child process and its native window. */

import { spawn, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { DesktopBridgeEndpoint } from '@deepseek-ai/dsh-desktop-bridge'
import { app, BrowserWindow, dialog } from 'electron'
import { registerDesktopCapabilities } from './desktop-capabilities.ts'
import {
  capturePrimaryDisplayRegion,
  disposePrimaryDisplayRegionCapture,
  preparePrimaryDisplayRegionCapture,
} from './platform/win32/screen-capture.ts'
import { parentProcessDesktopTransport } from './child-process-transport.ts'
import { parseDesktopLaunchArguments } from './launch-arguments.ts'
import { findWebUrl } from './server-output.ts'

const STARTUP_TIMEOUT_MS = 30_000
const require = createRequire(import.meta.url)
const cliPackagePath = require.resolve('@deepseek-ai/dsh/package.json')
const cliEntry = resolve(dirname(cliPackagePath), 'lib/bin.js')
let server: ChildProcess | undefined
let desktopBridge: DesktopBridgeEndpoint | undefined
let disposeCapabilities: (() => void) | undefined
let mainWindow: BrowserWindow | undefined
let quitting = false

/** Stop Desktop plugins and bridge dispatch before terminating the owned Host child. */
async function stopServer(): Promise<void> {
  const child = server
  server = undefined
  const disposeDesktopCapabilities = disposeCapabilities
  disposeCapabilities = undefined
  const bridge = desktopBridge
  desktopBridge = undefined
  disposeDesktopCapabilities?.()
  await disposePrimaryDisplayRegionCapture()
  await bridge?.dispose()
  if (child === undefined || child.exitCode !== null) return
  const exited = new Promise<void>((resolveExit) => {
    child.once('exit', () => { resolveExit() })
    child.once('error', () => { resolveExit() })
  })
  if (child.connected) child.disconnect()
  child.kill()
  await exited
}

/** Start the supported web profile and resolve its authenticated loopback URL. */
function startServer(): Promise<string> {
  return new Promise((resolveUrl, reject) => {
    const { patches, developmentCliEntry, developmentCliImport } = parseDesktopLaunchArguments(process.argv.slice(2))
    const child = spawn(process.execPath, [
      ...(developmentCliImport === undefined ? [] : ['--expose-internals', '--import', developmentCliImport]),
      developmentCliEntry === undefined ? cliEntry : resolve(developmentCliEntry),
      '--profile', 'desktop',
      ...patches.flatMap(patch => ['--patch', resolve(patch)]),
      '--no-open',
      '--port', '0',
    ], {
      cwd: process.cwd(),
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      serialization: 'advanced',
      windowsHide: true,
    })
    if (child.stdout === null || child.stderr === null) {
      child.kill()
      reject(new Error('dsh web did not expose its output streams'))
      return
    }
    const childStdout = child.stdout
    const childStderr = child.stderr
    server = child
    const bridge = new DesktopBridgeEndpoint(parentProcessDesktopTransport(child))
    desktopBridge = bridge
    disposeCapabilities = registerDesktopCapabilities(bridge, capturePrimaryDisplayRegion)
    let stdout = ''
    let stderr = ''
    let settled = false
    const timer = setTimeout(() => {
      fail(new Error(`dsh web did not start within ${String(STARTUP_TIMEOUT_MS / 1000)} seconds`))
    }, STARTUP_TIMEOUT_MS)

    const fail = (error: Error): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      void stopServer().then(() => { reject(error) }, () => { reject(error) })
    }

    childStdout.setEncoding('utf8')
    childStdout.on('data', (chunk: string) => {
      stdout += chunk
      const url = findWebUrl(stdout)
      if (url === undefined || settled) return
      clearTimeout(timer)
      settled = true
      resolveUrl(url)
    })
    childStderr.setEncoding('utf8')
    childStderr.on('data', (chunk: string) => {
      stderr = `${stderr}${chunk}`.slice(-8_192)
      process.stderr.write(chunk)
    })
    child.on('error', fail)
    child.on('exit', (code, signal) => {
      void bridge.dispose(new Error('Harness child exited'))
      if (quitting || settled) return
      const detail = stderr.trim()
      fail(new Error(`dsh web exited before startup (${String(code ?? signal)})${detail === '' ? '' : `: ${detail}`}`))
    })
  })
}

/** Open the authenticated local UI in a locked-down Electron renderer. */
async function createWindow(): Promise<void> {
  if (mainWindow !== undefined) {
    mainWindow.show()
    mainWindow.focus()
    return
  }
  await preparePrimaryDisplayRegionCapture()
  const url = await startServer()
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 900,
    minHeight: 640,
    title: 'DeepSeek Harness',
    backgroundColor: '#ffffff',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  window.webContents.on('console-message', (details) => {
    if (details.level !== 'error') return
    console.error(`Desktop renderer error at ${details.sourceId}:${String(details.lineNumber)}: ${details.message}`)
  })
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin !== new URL(url).origin) event.preventDefault()
  })
  window.on('close', (event) => {
    if (quitting) return
    event.preventDefault()
    window.hide()
  })
  window.on('closed', () => {
    mainWindow = undefined
  })
  mainWindow = window
  await window.loadURL(url)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.on('activate', () => {
    void createWindow()
  })

  app.on('before-quit', (event) => {
    if (quitting) return
    event.preventDefault()
    quitting = true
    void stopServer().then(() => { app.quit() })
  })

  app.on('window-all-closed', () => {
    // The Desktop Host remains available for global input while its window is hidden.
  })

  void app.whenReady().then(createWindow).catch(async (error: unknown) => {
    console.error('Desktop startup failed', error)
    const message = error instanceof Error ? error.message : String(error)
    await dialog.showMessageBox({ type: 'error', title: 'DeepSeek Harness', message: 'Desktop startup failed', detail: message })
    app.quit()
  })
}
