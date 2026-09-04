---
description: "定义交互式截图能力及其经过校验的 Desktop Bridge payload。"
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot

[English](README.md) | 中文

## 概述

`dsh-screenshot` 定义 `ctx.screenshot` 能力和共享的 `screenshot/capture` 请求。一次截图要么返回带像素尺寸的 PNG 字节，要么明确返回取消；不透明 capture id 可避免迟到结果被误当成新一次交互的结果。

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

Consumer 创建 `ScreenshotCaptureId` 并调用 `ctx.screenshot.capture`。Provider 必须在最终结果中原样保留该 id。跨进程收到的值须先通过 `parseScreenshotCaptureResult`，Host 代码才能使用其中的字节和尺寸。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details><summary>实现内部细节 — 点击展开</summary>

此 package 是 Service Definition 角色。它也扩展 Desktop Bridge 请求注册表，因为方法名和 payload 字段属于截图能力。Electron 捕获以及 Host attachment 接纳分别位于独立 provider 和 consumer package。两个进程端点各自校验收到的字段。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [Desktop provider](../screenshot-desktop/README.zh.md) — 把 service 请求转发给所属 Desktop shell。
- [Desktop Bridge](../bridge/README.zh.md) — 进程协议和取消语义。

-----

<a id="model-experience"></a>
## 模型体验

此 package 本身不产生模型体验。后续 consumer 持有 attachment 持久化和模型可见用户消息。

#### KV Cache 影响

无。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 首版协议只支持区域选择和 PNG 输出。
- 标注字段、多屏几何和设备触发不属于此 Service Definition。

<a id="dev-note"></a>
### 开发备注

<details><summary>维护者工作上下文 — 点击展开</summary>

只有两个 endpoint 都能校验并执行新字段时，才扩展协议。

</details>
