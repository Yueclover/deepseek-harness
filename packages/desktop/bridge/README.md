---
description: "Define and run the typed process protocol shared by a Harness Host and its owning Desktop shell."
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-bridge

English | [中文](README.zh.md)

## Summary

`dsh-desktop-bridge` is the single communication path between a Harness Host and its Desktop parent. It carries typed requests, responses, events, cancellation, and shutdown cleanup so Desktop capabilities do not create unrelated process channels.

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

Desktop capability packages extend `DesktopBridgeRequestMap` or `DesktopBridgeEventMap`. A transport connects two `DesktopBridgeEndpoint` instances; Host plugins use `ctx.desktopBridge`, while Desktop plugins register handlers on the parent endpoint. Aborting a request sends a cancellation frame. Disposing an endpoint rejects outbound requests, aborts inbound handlers, removes subscriptions, and waits for handler settlement.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

`protocol.ts` validates the untrusted frame envelope. `runtime.ts` correlates requests and contains listener failures. `index.ts` defines the Cordis service used by Host consumers. Payload validation remains the responsibility of each capability package because only that package owns the payload fields.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Architecture](../../../docs/architecture.md) — plugin composition and Host process rules.
- [Child-process provider](../bridge-child-process/README.md) — transport used by the Electron carrier.

-----

<a id="model-experience"></a>
## Model Experience

None, as the bridge transports capability data without adding model-visible content.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The bridge currently ships one child-process transport; reconnectable transports remain future providers.
- Capability payloads must fit the selected transport's serialization mode.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

Register every handler and listener through a disposable plugin effect. Never let a feature own or close the shared transport.

</details>
