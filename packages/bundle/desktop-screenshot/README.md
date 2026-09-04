---
description: "Compose shared input, Desktop screenshot capture, configurable delivery, and Client UI as one installable bundle."
kind: "package-bundle"
---

# @deepseek-ai/dsh-desktop-screenshot

English | [中文](README.zh.md)

## Summary

`dsh-desktop-screenshot` is the complete user-facing screenshot composition. Its patch loads the shared input service, MiMouse provider, child-process bridge, screenshot provider, clipboard action, target registry, default DSH Agent target, assistant Remote, and Client action.

## Table of Contents

- [Use this package](#use-this-package)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Apply `cordis.patch.yml` to the Desktop-owned Web profile. Set `DSH_DESKTOP_SCREENSHOT=0` before launch to disable the native handler, Host provider, assistant Remote, and Client action together. Set `DSH_MIMOUSE_SCREENSHOT=0` to disable only the MiMouse provider.

During source development, pass `cordis.source.patch.yml` explicitly for one Desktop run so every package resolves from this checkout:

```sh
pnpm desktop:dev -- --patch ./packages/bundle/desktop-screenshot/cordis.source.patch.yml
```

For distribution, pack and publish the repository's `dsh` release family, then install only the final bundle into the native `desktop` profile:

```sh
pnpm run release:pack -- --family dsh --out dist/npm
dsh plugin --profile desktop add @deepseek-ai/dsh-desktop-screenshot
```

A plain `pnpm desktop:dev` does not load this source overlay. A standalone bundle tarball expects its implementation-package versions to be available from the configured npm registry. Before publication, a fully local install must provide those dependency tarballs through a local registry or pnpm overrides. Remove the installed bundle with `dsh plugin --profile desktop remove @deepseek-ai/dsh-desktop-screenshot`; the profile manager removes its layer and pnpm removes dependencies that are no longer needed.

-----

<a id="model-experience"></a>
## Model Experience

Indirectly, through Session prompt admission performed after the user accepts a native screenshot selection.

#### KV Cache effect

Each accepted screenshot adds one image-bearing user message after the reusable prefix.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- The Electron carrier owns native windows and clipboard authority; this package owns the Harness plugin graph and Client asset reachability.
- Enabling the Host bundle without a connected Desktop Bridge makes capture fail explicitly.
- OCR, ASR long-press behavior, annotation tools, multi-display capture, signing, and installer construction remain separate follow-up work.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

The native carrier and Harness composition remain separate because Electron owns operating-system authority while Host plugins own device normalization, business actions, settings, and Agent admission. See the [Desktop subsystem](../../../docs/subsystems/desktop.md).

</details>
