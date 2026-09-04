---
description: "Deliver a captured PNG and prompt to an exact DSH Session as one user message."
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-target-dsh-agent

English | [中文](README.zh.md)

## Summary

This provider registers the `dsh-agent` screenshot target. It submits the configured prompt and PNG to the exact active Session through `sessionController.prompt`, preserving ordinary attachment admission, durable Session logging, queuing, and Agent resume behavior.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

## Use this package

Load it after `screenshotTargets` and `sessionController`. Requests without a Session id fail because this provider never guesses an active conversation.

## Model Experience

Indirectly, through `sessionController.prompt`, which appends the supplied text and admitted screenshot image as one user message.

#### KV Cache effect

The new user message is appended after the reusable request prefix.

## Known Limitations and Deferred Work

- This target requires an active DSH Session and does not serve clipboard-only hardware actions.
- PNG bytes are base64-encoded for prompt admission, which temporarily increases memory use.

### Dev Note

None.
