---
description: "定义并运行 Harness Host 与其所属 Desktop shell 共享的类型化进程协议。"
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-bridge

[English](README.md) | 中文

## 概述

`dsh-desktop-bridge` 是 Harness Host 与其 Desktop 父进程之间唯一的通信通道。它承载类型化请求、响应、事件、取消和停机清理，避免每项桌面能力各建一套进程通信。

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

Desktop 能力 package 扩展 `DesktopBridgeRequestMap` 或 `DesktopBridgeEventMap`。一个 transport 连接两个 `DesktopBridgeEndpoint`；Host 插件使用 `ctx.desktopBridge`，Desktop 插件在父进程 endpoint 上注册处理器。取消请求会发送取消帧。销毁 endpoint 会拒绝尚未完成的外发请求、中止入站处理器、移除订阅，并等待处理器结束。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现内部细节 — 点击展开</summary>

`protocol.ts` 校验不可信的帧外层字段；`runtime.ts` 关联请求并隔离监听器异常；`index.ts` 定义 Host consumer 使用的 Cordis service。每项能力自行校验 payload，因为只有能力 package 持有其字段定义。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [架构](../../../docs/architecture.zh.md) — 插件组合与 Host 进程规则。
- [子进程 provider](../bridge-child-process/README.zh.md) — Electron carrier 使用的 transport。

-----

<a id="model-experience"></a>
## 模型体验

无。Bridge 只传输能力数据，不增加模型可见内容。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 当前只提供子进程 transport；可重连 transport 由后续 provider 实现。
- 能力 payload 必须适合所选 transport 的序列化方式。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文 — 点击展开</summary>

所有处理器和监听器都必须通过可销毁的插件 effect 注册。功能插件不得持有或关闭共享 transport。

</details>
