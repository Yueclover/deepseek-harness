---
description: "Define interactive screenshot capture and its validated Desktop Bridge payloads."
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot

English | [中文](README.zh.md)

## Summary

`dsh-screenshot` defines the `ctx.screenshot` capability. A capture either returns PNG bytes with pixel dimensions or an explicit cancellation; opaque capture ids prevent late results from being mistaken for a newer interaction.

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

Consumers create a `ScreenshotCaptureId` and call `ctx.screenshot.capture`. Providers must preserve that id in the terminal result. Values received from another process pass through `parseScreenshotCaptureResult` before Host code uses their bytes or dimensions.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details><summary>Implementation internals — click to expand</summary>

The package is the Service Definition role. Electron capture, process transport, and Host attachment admission live in separate provider and consumer packages.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Desktop provider](../screenshot-desktop/README.md) — forwards the service request to the owning Desktop shell.
- [Desktop Bridge](../bridge/README.md) — process protocol and cancellation.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through a consumer that persists the attachment and creates the model-visible user message.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The first protocol supports region selection and PNG output only.
- Annotation fields, multi-display geometry, and device triggers are intentionally outside this Service Definition.

<a id="dev-note"></a>
### Dev Note

<details><summary>Working context for maintainers — click to expand</summary>

Add protocol fields only when both endpoints can validate and honor them.

</details>
