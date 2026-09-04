---
description: "Architecture and lifecycle of the Windows Desktop carrier, generic operating-system capabilities, reusable input plugins, and the screenshot assistant bundle."
kind: "architecture"
---

# Desktop subsystem

English | [中文](desktop.zh.md)

## Summary

The Desktop subsystem keeps operating-system authority in one Electron main process and keeps installable behavior in ordinary Cordis packages. Electron starts the supported `desktop` profile as a child process, provides generic screen-capture and clipboard methods over Desktop Bridge, and hosts the existing Web Client in a locked-down renderer. The Host process loads input, screenshot, target, assistant, and Client plugins through the same profile and bundle mechanisms as other Harness features.

## Ownership

| Layer | Owns | Does not own |
|---|---|---|
| [`apps/desktop`](../../apps/desktop/README.md) | Electron lifecycle, secure BrowserWindow, child process, Windows selection overlay, screen pixels, clipboard | MiMouse protocol, button bindings, screenshot destinations, Agent delivery |
| [`packages/desktop`](../../packages/desktop/README.md) | Bridge service, hardware normalization, gestures, screenshot service, business orchestration | Electron application packaging and native window lifetime |
| [`packages/client/ui-screenshot`](../../packages/client/ui-screenshot/README.md) | Composer control, localized status, explicit Session id | Screen capture and hardware access |
| [`packages/bundle/desktop-screenshot`](../../packages/bundle/desktop-screenshot/README.md) | Installable screenshot feature composition | Electron main-process code |

## Process flow

The Electron process starts `dsh --profile desktop --no-open --port 0`. The Host-side child-process bridge uses the inherited IPC channel. Capture requests cross that channel as generic `screen/capture-region` messages; clipboard writes use `clipboard/write-png`. No dynamically installed package executes inside Electron main.

The MiMouse provider publishes `mimouse.screenshot` to `ctx.desktopInput`. The screenshot assistant contributes a short-press binding and a clipboard action. The Client composer instead calls the assistant Remote with the exact Session id; the configured target defaults to `dsh-agent`, which admits the prompt and PNG as one Session user message.

## Development and packaging

From a source checkout, `pnpm desktop:dev` builds and starts the carrier without a development plugin overlay. Pass [`cordis.source.patch.yml`](../../packages/bundle/desktop-screenshot/cordis.source.patch.yml) through `--patch` for a temporary source run. Persistent installations use the bundle's exported [`cordis.patch.yml`](../../packages/bundle/desktop-screenshot/cordis.patch.yml) through native `dsh plugin --profile desktop` management.

Each `packages/desktop/*` directory is a normal publishable package and can evolve independently. The user-facing install unit is `@deepseek-ai/dsh-desktop-screenshot`; its dependencies bring the required packages into the profile. `scratch-plugin` is not part of discovery, build, installation, or packaging.

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

<a id="ctxdesktopbridge--desktopbridge-abstract-seam"></a>

### `ctx.desktopBridge` — `DesktopBridge` (abstract seam)

Host-facing access to capabilities registered by the attached Desktop shell.

```ts cordis-catalog
/**
 * Send one typed request to the Desktop shell.
 * @param method - Registered Desktop method.
 * @param payload - Method payload.
 * @param signal - Optional cancellation signal.
 * @returns The Desktop response.
 */
abstract request<K extends DesktopBridgeRequestName>( method: K, payload: RequestOf<K>, signal?: AbortSignal, ): Promise<ResponseOf<K>>

/**
 * Subscribe to one typed Desktop event.
 * @param event - Registered event name.
 * @param listener - Event recipient.
 * @returns A subscription disposer.
 */
abstract on<K extends DesktopBridgeEventName>( event: K, listener: (payload: DesktopBridgeEventMap[K]) => void, ): () => void
```

Source: [`packages/desktop/bridge/src/index.ts`](../../packages/desktop/bridge/src/index.ts)

<a id="ctxdesktopinput--desktopinput"></a>

### `ctx.desktopInput` — `DesktopInput`

Shared Desktop input service; providers publish controls and business plugins own mappings.

```ts cordis-catalog
/**
 * Register one semantic action until the returned disposer runs.
 * @param id - Unique semantic action id.
 * @param handler - Action event handler.
 * @returns The idempotent registration disposer.
 */
registerAction(id: InputActionId, handler: InputActionHandler): () => void

/**
 * Register one binding contribution without replacing other business plugins' mappings.
 * @param binding - Physical control to semantic action mapping.
 * @returns The idempotent registration disposer.
 */
registerBinding(binding: InputBinding): () => void

/**
 * Publish one normalized provider event. Action failures are contained.
 * @param event - Provider event to recognize and dispatch.
 */
publish(event: DesktopInputEvent): void
```

Source: [`packages/desktop/input/src/index.ts`](../../packages/desktop/input/src/index.ts)

<a id="ctxscreenshot--screenshot-abstract-seam"></a>

### `ctx.screenshot` — `Screenshot` (abstract seam)

Interactive screenshot capability used by Desktop inputs and other consumers.

```ts cordis-catalog
/**
 * Open one capture interaction.
 * @param request - Interactive capture request.
 * @param signal - Optional cancellation signal.
 * @returns The terminal capture result.
 */
abstract capture(request: ScreenshotCaptureRequest, signal?: AbortSignal): Promise<ScreenshotCaptureResult>

/**
 * Write a captured PNG to the operating-system clipboard.
 * @param image - Validated captured PNG.
 * @param signal - Optional cancellation signal.
 */
abstract copyToClipboard(image: ScreenshotImage, signal?: AbortSignal): Promise<void>
```

Source: [`packages/desktop/screenshot/src/index.ts`](../../packages/desktop/screenshot/src/index.ts)

<a id="ctxscreenshottargets--screenshottargets"></a>

### `ctx.screenshotTargets` — `ScreenshotTargets`

Live registry used by the assistant and its settings page.

```ts cordis-catalog
/**
 * Register one target until the returned disposer runs.
 * @param target - Named screenshot destination.
 * @returns The idempotent registration disposer.
 */
register(target: ScreenshotTarget): () => void

/**
 * Return the installed targets in registration order.
 * @returns Target ids and display names.
 */
list(): readonly Pick<ScreenshotTarget, 'id' | 'displayName'>[]

/**
 * Deliver to the exact configured target without silently selecting another provider.
 * @param id - Exact configured target id.
 * @param request - Captured image and delivery context.
 * @param signal - Delivery cancellation signal.
 */
async send(id: ScreenshotTargetId, request: ScreenshotTargetRequest, signal: AbortSignal): Promise<void>
```

Source: [`packages/desktop/screenshot-target/src/index.ts`](../../packages/desktop/screenshot-target/src/index.ts)
<!-- END GENERATED cordis-surface -->

## Known limitations

- The current native implementation supports Windows x64 and primary-display region capture.
- Annotation, OCR, ASR, multi-display selection, signing, and installer generation are separate follow-up capabilities.
- Closing the application window hides it and leaves the Desktop Host running for global input; the current carrier has no tray menu.
