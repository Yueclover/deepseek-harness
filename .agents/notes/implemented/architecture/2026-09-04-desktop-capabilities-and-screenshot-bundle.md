# Agent Note: Desktop capabilities and screenshot bundle

Status: implemented

English | [中文](2026-09-04-desktop-capabilities-and-screenshot-bundle.zh.md)

## Problem

The screenshot assistant needs Windows screen pixels, clipboard access, and a private HID interface, but dynamically installed Cordis packages execute in the Harness Host and Client rather than Electron main. Treating every internal class as an installable plugin would also expose implementation fragments as user-managed units and duplicate input timing across future assistants.

A scratch-only package tree can demonstrate the feature but bypasses the repository's package discovery, release constraints, profile installation, Client bundling, and generated Remote artifacts. Extending all build tools with another package root would create a second plugin protocol instead of using the supported one.

## Decision

`apps/desktop` is the fixed Electron carrier. It starts the supported `desktop` profile as an owned Host child, renders the existing Web Client, and exposes only generic operating-system methods over `dsh-desktop-bridge`: interactive region capture and PNG clipboard writes. Dynamically installed packages never execute in Electron main.

Reusable Cordis packages live under `packages/desktop`. `dsh-desktop-input` combines normalized device events, dynamic physical bindings, short-press recognition, long-press recognition, and semantic action dispatch because those registrations share one active press cycle and one conflict domain. Hardware providers represent a whole device protocol rather than one package per button; the MiMouse provider currently publishes only the captured `mimouse.screenshot` control and contains no screenshot business behavior.

Screenshot capability, Desktop provider, target registry, DSH Agent target, assistant orchestration, and Client UI remain separate packages where their provider or consumer roles evolve independently. The assistant contributes the screenshot action and default physical binding at runtime. Hardware-triggered capture copies to the clipboard; the composer Remote carries an exact Session id and sends through the configured target.

`@deepseek-ai/dsh-desktop-screenshot` is the user-facing install unit. Its exported `cordis.patch.yml` composes every required Host and Client package, while ordinary npm dependencies install those implementation packages. The source-only `cordis.source.patch.yml` supports repository development and is not published. Native `dsh plugin --profile desktop add/remove` owns installation and uninstallation.

## Alternatives considered

- **Make Electron main dynamically load feature packages.** The repository has no such lifecycle, permission, isolation, or packaging protocol, and adding one is unnecessary for generic screen and clipboard operations.
- **Publish one installable package for every registry, gesture, and button.** These units do not provide useful standalone behavior and would make users manage the internal dependency graph.
- **Put screenshot business code in the Electron application.** That would prevent profile installation, Client discovery, target replacement, and reuse by other Desktop business plugins.
- **Keep `scratch-plugin` as a second workspace root.** This would require permanent exceptions in TypeScript aliases, Typert discovery, Client bundling, tests, and release tooling.

## Consequences

- Formal packages participate in the existing workspace, Host/Client build faces, release validation, and bundle installation without a new plugin protocol.
- Future text or voice assistants reuse Desktop Bridge and Desktop input while owning their own actions and bindings. Another MiMouse button extends the same hardware provider after protocol fixtures exist.
- The Electron application remains a separately delivered client shell. Windows x64, primary-display selection, and background window hiding are implemented; multi-display selection, annotations, OCR, ASR, tray UI, signing, and installer production remain explicit follow-up work.
- The superseded scratch-package-build note is deleted because its additional package-root decision is not part of the implemented architecture.
