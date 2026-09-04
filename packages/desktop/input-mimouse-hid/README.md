---
description: "Publish the known MiMouse screenshot control through the shared Desktop input service on Windows x64."
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-input-mimouse-hid

English | [中文](README.zh.md)

## Summary

This provider discovers supported MiMouse private HID collections, decodes the known screenshot-key down and up reports, and publishes `mimouse.screenshot` through `ctx.desktopInput`. It does not choose a business action or know about screenshot behavior.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Use this package

Load it after `dsh-desktop-input` on Windows x64. `scanIntervalMs` controls hot-plug polling. Unsupported platforms fail during plugin load instead of silently disabling input.

## Model Experience

None, as the HID provider registers no model-facing content.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

- Only known vendor ids, private usage page `0xff12`, and screenshot reports `0x32` and `0x41` are decoded.
- Additional physical buttons belong in this hardware provider only after captured protocol fixtures define them; business actions remain separate plugins.

### Dev Note

None.
