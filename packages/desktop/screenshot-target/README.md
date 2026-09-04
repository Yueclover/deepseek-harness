---
description: "Register named screenshot delivery destinations and resolve the exact destination selected by user settings."
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-target

English | [中文](README.zh.md)

## Summary

`dsh-screenshot-target` owns the live destination registry used by the screenshot assistant. Each destination is independently registered with an id, display name, and asynchronous `send` method. Missing configured destinations fail explicitly; the registry never substitutes another target.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Use this package

Load one registry before target providers and the screenshot assistant. Providers retain their registration disposer through `ctx.effect`; settings store the branded target id as a string.

## Model Experience

Indirectly, through the selected target, which owns any model-visible delivery.

#### KV Cache effect

The registry itself has no cache effect.

## Known Limitations and Deferred Work

- Target enumeration is process-local and does not yet have a settings-page Remote.
- Delivery retry and durability belong to each target provider.

### Dev Note

None.
