---
description: "Provide ctx.screenshot by forwarding capture requests over the Desktop Bridge."
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-desktop

English | [中文](README.zh.md)

## Summary

This Host provider implements `ctx.screenshot` for Desktop compositions. It forwards capture and cancellation over `ctx.desktopBridge`, then validates the returned process value before exposing it to Harness consumers.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Load this provider after a `desktopBridge` provider in a Desktop-only Host composition. Do not load it in a remote server profile whose process has no owning Desktop shell.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details><summary>Implementation internals — click to expand</summary>

The provider contains no screen API. It is the Host half of the capability and leaves operating-system permission, region UI, and PNG generation to the matching Electron plugin.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Screenshot definition](../screenshot/README.md) — request and result fields.
- [Desktop Bridge](../bridge/README.md) — shared process channel.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through a screenshot consumer that turns captured bytes into a durable attachment and user message.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- Capture fails when the Desktop bundle is disabled or disconnected.

<a id="dev-note"></a>
### Dev Note

<details><summary>Working context for maintainers — click to expand</summary>

Keep attachment storage out of this provider so capture remains usable by more than one consumer.

</details>
