---
description: "Desktop process transport, device input, screen capture, and screenshot delivery capabilities for native DeepSeek Harness applications."
kind: "package-group"
---

# desktop/ — native Desktop capabilities

English | [中文](README.zh.md)

## Summary

The desktop group separates reusable Host plugins from the Electron application that owns operating-system authority. The bridge carries generic requests between processes, input providers normalize hardware controls, screenshot providers capture and copy images, and the screenshot assistant composes those capabilities into user actions.

## Packages

| Package | Responsibility |
|---|---|
| [`bridge`](bridge/README.md) | Typed Desktop request transport and generic screen/clipboard messages |
| [`bridge-child-process`](bridge-child-process/README.md) | Host provider for Electron-owned child-process IPC |
| [`input`](input/README.md) | Device-neutral actions, bindings, press recognition, and hold recognition |
| [`input-mimouse-hid`](input-mimouse-hid/README.md) | Windows x64 MiMouse private-HID provider |
| [`screenshot`](screenshot/README.md) | Screenshot Service Definition |
| [`screenshot-desktop`](screenshot-desktop/README.md) | Desktop Bridge screenshot provider |
| [`screenshot-target`](screenshot-target/README.md) | Configurable screenshot destination registry |
| [`screenshot-target-dsh-agent`](screenshot-target-dsh-agent/README.md) | DSH Agent destination |
| [`screenshot-assistant`](screenshot-assistant/README.md) | Capture, clipboard, settings, input, and Remote orchestration |

## Related documentation

- [Desktop subsystem](../../docs/subsystems/desktop.md) — process ownership and package composition.
- [Desktop screenshot bundle](../bundle/desktop-screenshot/README.md) — the independently installable final feature.

## Dev Note

None.
