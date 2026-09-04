---
description: "在 Windows x64 上通过共享桌面输入服务发布已知米鼠截图按键。"
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-input-mimouse-hid

[English](README.md) | 中文

## 概述

此 provider 发现受支持的米鼠私有 HID collection，解码已知截图键的按下和松开报告，并通过 `ctx.desktopInput` 发布 `mimouse.screenshot`。它不选择业务动作，也不了解截图业务。

## 目录

- [使用此包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用此包

在 Windows x64 上于 `dsh-desktop-input` 之后加载。`scanIntervalMs` 控制热插拔轮询。插件在不受支持的平台加载时会明确失败，而不是静默禁用输入。

<a id="model-experience"></a>
## 模型体验

无，因为 HID provider 不注册任何面向模型的内容。

#### KV Cache 影响

无。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 目前只解码已知 vendor id、私有 usage page `0xff12` 以及截图报告 `0x32` 和 `0x41`。
- 只有在捕获的协议 fixture 明确定义后，其他物理按键才应加入此硬件 provider；业务动作始终属于独立插件。

<a id="dev-note"></a>
### 开发备注

无。
