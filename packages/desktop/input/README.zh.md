---
description: "把桌面输入归一化为可动态注册的短按与长按语义动作。"
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-input

[English](README.md) | 中文

## 概述

`dsh-desktop-input` 是共享且与设备无关的输入能力。硬件 provider 发布归一化控制事件，业务插件分别注册语义动作和物理绑定。短按在松开时触发；已注册的长按在自己的阈值后触发，并接收松开或取消阶段。

## 目录

- [使用此包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用此包

在 Desktop Host 中加载一个服务。设备包调用 `ctx.desktopInput.publish`；业务包通过插件 effect 持有动作和绑定注册。设备断开、绑定销毁和服务销毁都会取消活动长按。

<a id="model-experience"></a>
## 模型体验

无，因为输入归一化和分发不会注册任何面向模型的内容。

#### KV Cache 影响

无。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 输入来源目前能表示鼠标和键盘控制，但随附 provider 只提供鼠标控制。
- 冲突绑定会同时分发；未来的设置界面必须避免非预期重叠。

<a id="dev-note"></a>
### 开发备注

无。
