---
description: "Windows 桌面载体、通用操作系统能力、可复用输入插件和截图助手 bundle 的架构与生命周期。"
kind: "architecture"
---

# 桌面子系统

[English](desktop.md) | 中文

## 概述

桌面子系统把操作系统权限保留在一个 Electron main 进程中，把可安装行为保留在普通 Cordis 包中。Electron 以子进程方式启动受支持的 `desktop` profile，通过 Desktop Bridge 提供通用屏幕捕获和剪贴板方法，并在受限 renderer 中承载现有 Web Client。Host 进程通过与其他 Harness 功能相同的 profile 和 bundle 机制加载输入、截图、目标、助手和 Client 插件。

## 归属

| 层 | 负责 | 不负责 |
|---|---|---|
| [`apps/desktop`](../../apps/desktop/README.zh.md) | Electron 生命周期、安全 BrowserWindow、子进程、Windows 选区蒙层、屏幕像素、剪贴板 | 米鼠协议、按键绑定、截图目标、Agent 投递 |
| [`packages/desktop`](../../packages/desktop/README.zh.md) | Bridge 服务、硬件归一化、手势、截图服务、业务编排 | Electron 应用打包和原生窗口生命周期 |
| [`packages/client/ui-screenshot`](../../packages/client/ui-screenshot/README.zh.md) | 输入框控制、中文状态、准确 Session id | 屏幕捕获和硬件访问 |
| [`packages/bundle/desktop-screenshot`](../../packages/bundle/desktop-screenshot/README.zh.md) | 可安装截图功能组合 | Electron main 进程代码 |

## 进程流程

Electron 进程启动 `dsh --profile desktop --no-open --port 0`。Host 侧子进程 bridge 使用继承的 IPC 通道。捕获请求以通用 `screen/capture-region` 消息通过该通道；剪贴板写入使用 `clipboard/write-png`。动态安装的包不会在 Electron main 内执行。

米鼠 provider 向 `ctx.desktopInput` 发布 `mimouse.screenshot`。截图助手贡献短按绑定和剪贴板动作。Client 输入框则使用准确 Session id 调用助手 Remote；配置目标默认为 `dsh-agent`，它把提示词和 PNG 作为一条 Session 用户消息接纳。

## 开发与打包

在源码工作区中，`pnpm desktop:dev` 会构建并启动 carrier，不应用开发插件 overlay。若要临时运行源码插件，可通过 `--patch` 传入 [`cordis.source.patch.yml`](../../packages/bundle/desktop-screenshot/cordis.source.patch.yml)。持久安装使用 bundle 导出的 [`cordis.patch.yml`](../../packages/bundle/desktop-screenshot/cordis.patch.yml)，并由原生 `dsh plugin --profile desktop` 管理。

每个 `packages/desktop/*` 目录都是普通可发布包，可以独立演进。面向用户的安装单元是 `@deepseek-ai/dsh-desktop-screenshot`；它的依赖会把所需包带入 profile。`scratch-plugin` 不参与发现、构建、安装或打包。

<!-- BEGIN GENERATED cordis-surface (gen-cordis-catalog.ts) — do not edit between markers -->

<a id="cordis-surface"></a>

## Cordis API

Generated from source by `scripts/gen-cordis-catalog.ts` (verified fresh by `pnpm run verify-cordis-catalog` in doc-sync; regenerate with `pnpm run gen-cordis-catalog`) — the language sides differ only in locale-specific paired document paths. Signature blocks use a `ts cordis-catalog` fence and keep the original source JSDoc; dispatch modes are defined in the [primer](../cordis-primer.zh.md#dispatch-modes), and the framework-inherited `ctx` API lives in [cordis-api/inherited.md](../cordis-api/inherited.md).

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

## 已知限制

- 当前原生实现支持 Windows x64 和主显示器区域捕获。
- 标注、OCR、ASR、多显示器选择、签名和安装器生成属于后续独立能力。
- 关闭应用窗口会隐藏窗口，并让 Desktop Host 为全局输入继续运行；当前载体尚无托盘菜单。
