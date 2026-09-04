---
description: "把捕获的 PNG 和提示词作为一条用户消息投递到准确的 DSH Session。"
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-target-dsh-agent

[English](README.md) | 中文

## 概述

此 provider 注册 `dsh-agent` 截图目标。它通过 `sessionController.prompt` 把配置的提示词和 PNG 提交到准确的活动 Session，保留常规附件接纳、持久 Session 日志、排队和 Agent 恢复行为。

## 目录

- [使用此包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用此包

在 `screenshotTargets` 和 `sessionController` 之后加载。没有 Session id 的请求会失败，因为此 provider 不猜测活动会话。

<a id="model-experience"></a>
## 模型体验

模型会看到一条包含所提供文本和已接纳截图图像的新用户消息。

#### KV Cache 影响

新用户消息追加在可复用请求前缀之后。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 此目标要求活动 DSH Session，不处理只写入剪贴板的硬件动作。
- PNG 字节在提示接纳时会编码为 base64，临时增加内存占用。

<a id="dev-note"></a>
### 开发备注

无。
