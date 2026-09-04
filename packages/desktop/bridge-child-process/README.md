---
description: "Provide ctx.desktopBridge over the Electron-owned Harness child-process IPC channel."
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-bridge-child-process

English | [中文](README.zh.md)

## Summary

This provider exposes `ctx.desktopBridge` inside a Harness process launched with a Node IPC channel. It adapts `process.send` and `message` to the shared Desktop Bridge runtime and releases pending work when its Cordis scope stops.

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

Load it once in the Desktop-specific Host patch. Startup fails if the process has no IPC channel; ordinary web and headless launches therefore do not silently pretend to have Desktop capabilities.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details><summary>Implementation internals — click to expand</summary>

The provider owns one endpoint but not the process channel. Cordis disposal waits for endpoint cleanup, including active inbound handlers.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Desktop Bridge](../bridge/README.md) — protocol and lifecycle semantics.

-----

<a id="model-experience"></a>
## Model Experience

None, as this provider only connects the shared process transport.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The provider requires a long-lived parent process and Node advanced IPC serialization for binary screenshot payloads.

<a id="dev-note"></a>
### Dev Note

<details><summary>Working context for maintainers — click to expand</summary>

The Electron carrier, not this provider, owns child-process termination.

</details>
