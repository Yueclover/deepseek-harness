---
description: "通过 Electron 持有的 Harness 子进程 IPC 通道提供 ctx.desktopBridge。"
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-bridge-child-process

[English](README.md) | 中文

## 概述

此 provider 在由 Node IPC 通道启动的 Harness 进程中提供 `ctx.desktopBridge`。它把 `process.send` 和 `message` 接入共享 Desktop Bridge runtime，并在 Cordis scope 停止时释放未完成工作。

## 目录

- [使用此 package](#use-this-package)
- [了解实现](#understand-the-implementation)
- [延伸阅读](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此 package

只在 Desktop 专用 Host patch 中加载一次。进程没有 IPC 通道时立即启动失败，因此普通 web 和 headless 启动不会假装具有 Desktop 能力。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details><summary>实现内部细节 — 点击展开</summary>

Provider 持有一个 endpoint，但不持有进程通道。Cordis 销毁会等待 endpoint 完成清理，包括仍在执行的入站处理器。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Desktop Bridge](../bridge/README.zh.md) — 协议和生命周期语义。

-----

<a id="model-experience"></a>
## 模型体验

无。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- Provider 要求长期存活的父进程；二进制截图 payload 要求 Node advanced IPC serialization。

<a id="dev-note"></a>
### 开发备注

<details><summary>维护者工作上下文 — 点击展开</summary>

子进程终止由 Electron carrier 持有，不由此 provider 持有。

</details>
