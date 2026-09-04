---
description: "通过 Desktop Bridge 转发捕获请求来提供 ctx.screenshot。"
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-desktop

[English](README.md) | 中文

## 概述

此 Host provider 为 Desktop 组合实现 `ctx.screenshot`。它通过 `ctx.desktopBridge` 转发捕获和取消，并在向 Harness consumer 暴露结果前校验跨进程返回值。

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

在 Desktop 专用 Host 组合中，将此 provider 加载在 `desktopBridge` provider 之后。没有所属 Desktop shell 的远程服务器 profile 不应加载它。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details><summary>实现内部细节 — 点击展开</summary>

此 provider 不包含屏幕 API。它只承担能力的 Host 部分，把操作系统权限、区域选择 UI 和 PNG 生成留给配套 Electron 插件。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [截图定义](../screenshot/README.zh.md) — 请求和结果字段。
- [Desktop Bridge](../bridge/README.zh.md) — 共享进程通道。

-----

<a id="model-experience"></a>
## 模型体验

此 provider 本身不产生模型体验。截图 consumer 决定何时将图像变成持久 attachment 和用户消息。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- Desktop bundle 被禁用或连接断开时，捕获会失败。

<a id="dev-note"></a>
### 开发备注

<details><summary>维护者工作上下文 — 点击展开</summary>

Attachment 存储不得进入此 provider，从而允许多个 consumer 复用捕获能力。

</details>
