---
description: "Run the supported Desktop profile in a secure Electron window and provide generic Windows screen and clipboard capabilities."
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-app

English | [中文](README.zh.md)

## Summary

`dsh-desktop-app` is the native Electron carrier. It starts `dsh --profile desktop` with Electron's executable in Node mode, connects the Host child over IPC, registers generic region-capture and PNG-clipboard methods, and loads the authenticated loopback Web Client in a sandboxed BrowserWindow. It does not load dynamically installed code into Electron main.

## Use this package

Build the repository and start the source application with one command:

```sh
pnpm desktop:dev
```

A plain launch applies the `desktop` profile and its installed bundles, but no development plugin overlay. Pass the same repeatable `--patch` option as the Web launcher to load a local overlay for one run:

```sh
pnpm desktop:dev -- --patch ./scratch-plugin/cordis.yml
```

`pnpm desktop` starts the existing build and accepts the same `--patch` option without rebuilding. Install a bundle persistently with `pnpm dsh plugin --profile desktop add <package>`; remove it with the matching `remove` command. Closing the window hides it so global input remains active; launching a second instance restores the existing window. Application quit disposes native capture state, the bridge, and the owned Host child.

## Understand the implementation

| File | Responsibility |
|---|---|
| [`src/main.ts`](src/main.ts) | Electron, BrowserWindow, Desktop profile, and child-process lifetime |
| [`src/desktop-capabilities.ts`](src/desktop-capabilities.ts) | Generic Desktop Bridge screen and clipboard handlers |
| [`src/platform/win32/screen-capture.ts`](src/platform/win32/screen-capture.ts) | Primary-display selection overlay, DPR conversion, crop, and PNG output |
| [`src/child-process-transport.ts`](src/child-process-transport.ts) | Parent endpoint transport |

No runtime invariant companion is published: the carrier owns one child, one bridge, and one window, and these relationships cannot diverge independently.

## Further Exploration

- [Desktop subsystem](../../docs/subsystems/desktop.md) — package and process ownership.
- [Desktop screenshot bundle](../../packages/bundle/desktop-screenshot/README.md) — installable business composition.

## Model Experience

None, as the carrier adds no prompt, schema, tool result, or Session message.

#### KV Cache effect

None; loaded Host plugins own their effects.

## Known Limitations and Deferred Work

- Windows x64 is the first supported target; signing and installer production are not yet configured.
- Region selection currently covers the primary display and has no annotation tools.
- Background operation has no tray menu; close hides the window and process termination remains the explicit quit path.

## Dev Note

None.
