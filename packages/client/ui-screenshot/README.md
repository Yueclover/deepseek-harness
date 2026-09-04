---
description: "Add a localized Desktop screenshot action and capture status to the Session composer."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-screenshot

English | [中文](README.zh.md)

## Summary

`dsh-client-ui-screenshot` registers the screenshot action in each materialized Session composer. It sends the exact Session id and localized prompt through the Desktop screenshot Remote, disables the action while capture is active, and reports cancellation, success, or failure.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Load it in the Web Client composition. The Client plugin mounts its generated screenshot Remote contribution before registering the composer action and disposes both together. Its `remote.screenshotAssistant` injection keeps the action absent when the Host side of the screenshot bundle is disabled.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through the Desktop screenshot Remote that admits the captured image and localized prompt as a Session user message.

#### KV Cache effect

Each accepted screenshot adds one user message after the reusable prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The control is available only when the native Desktop provider and Host Remote are connected.
- The initial control uses the default localized analysis prompt and does not expose annotation options.

<a id="dev-note"></a>
### Dev Note

<details><summary>Working context for maintainers — click to expand</summary>

Keep Session addressing explicit in the Remote request; the active composer is the only authoritative source for the target Session id.

</details>
