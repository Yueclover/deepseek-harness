---
description: "Normalize Desktop input into dynamically registered semantic press and hold actions."
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-input

English | [中文](README.zh.md)

## Summary

`dsh-desktop-input` is the shared device-neutral input capability. Hardware providers publish normalized controls, while business plugins independently register semantic actions and physical bindings. A short press fires on release; a registered hold fires after its own threshold and receives release or cancellation.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Use this package

Load one service in the Desktop Host. Device packages call `ctx.desktopInput.publish`; business packages own their action and binding registrations through plugin effects. Device disconnect, binding disposal, and service disposal cancel active holds.

## Model Experience

None, as input normalization and dispatch register no model-facing content.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

- Input sources currently identify mouse and keyboard controls, but the shipped provider supplies mouse controls only.
- Conflicting bindings are both dispatched; a future settings surface must prevent unwanted overlaps.

### Dev Note

None.
