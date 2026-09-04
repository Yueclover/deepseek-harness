---
description: "面向 DeepSeek Harness 原生桌面应用的进程通信、设备输入、屏幕捕获和截图投递能力。"
kind: "package-group"
---

# desktop/ — 原生桌面能力

[English](README.md) | 中文

## 概述

desktop 组把可复用的 Host 插件与持有操作系统权限的 Electron 应用分开。bridge 在进程之间承载通用请求，输入 provider 归一化硬件按键，截图 provider 捕获并复制图像，截图助手再把这些能力组合为用户操作。

## 包

| 包 | 职责 |
|---|---|
| [`bridge`](bridge/README.zh.md) | 类型化桌面请求通信以及通用屏幕和剪贴板消息 |
| [`bridge-child-process`](bridge-child-process/README.zh.md) | Electron 所有子进程 IPC 的 Host provider |
| [`input`](input/README.zh.md) | 与设备无关的动作、绑定、短按识别和长按识别 |
| [`input-mimouse-hid`](input-mimouse-hid/README.zh.md) | Windows x64 米鼠私有 HID provider |
| [`screenshot`](screenshot/README.zh.md) | 截图 Service Definition |
| [`screenshot-desktop`](screenshot-desktop/README.zh.md) | Desktop Bridge 截图 provider |
| [`screenshot-target`](screenshot-target/README.zh.md) | 可配置的截图目标注册表 |
| [`screenshot-target-dsh-agent`](screenshot-target-dsh-agent/README.zh.md) | DSH Agent 投递目标 |
| [`screenshot-assistant`](screenshot-assistant/README.zh.md) | 捕获、剪贴板、设置、输入和 Remote 编排 |

## 相关文档

- [桌面子系统](../../docs/subsystems/desktop.zh.md) — 进程归属和包组合。
- [桌面截图 bundle](../bundle/desktop-screenshot/README.zh.md) — 可独立安装的最终功能。

## 开发备注

无。
