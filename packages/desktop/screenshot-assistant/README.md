---
description: "Capture a Desktop region and deliver it through the screenshot target selected in user settings."
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-assistant

English | [中文](README.zh.md)

## Summary

`dsh-screenshot-assistant` coordinates interactive capture and delivery. It reads the user's `screenshot-assistant.targetId` setting for every operation and sends the captured PNG to that exact registered target. The default bundle installs the `dsh-agent` target, which admits the image and prompt through the existing Session prompt path.

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

Load the plugin only in the Desktop Host composition. Call `screenshotAssistant.capture` with an exact Session id, a non-empty prompt, and the annotation choice. Cancellation performs no delivery. A successful call returns only after the configured target accepts the image.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details><summary>Implementation internals — click to expand</summary>

The assistant owns target selection but not target behavior. `dsh-screenshot-target-dsh-agent` separately calls `sessionController.prompt`, preserving image-modality checks, Attachment persistence, durable message logging, and Agent resume behavior without coupling every destination to DSH Sessions.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Screenshot definition](../screenshot/README.md) — capture request and PNG result.
- [Prototype package map](../../README.md) — independently installed screenshot destinations and the final composition.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the selected target, which owns delivery; the default DSH Agent target records the supplied text and captured image as one user message.

#### KV Cache effect

Each accepted screenshot adds a new user message and invalidates the request suffix after the prior cached prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The caller must supply a non-empty prompt. The default DSH Agent target also requires an exact Session id.
- The settings namespace is implemented, but the target selector has not yet been added to the graphical settings page.
- PNG bytes are base64-encoded before Session admission, adding temporary memory overhead.

<a id="dev-note"></a>
### Dev Note

<details><summary>Working context for maintainers — click to expand</summary>

Target plugins own delivery guarantees. The assistant must never silently replace an unavailable configured target.

</details>
