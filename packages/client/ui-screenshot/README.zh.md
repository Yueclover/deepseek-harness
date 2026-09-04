---
description: "在 Session 输入区添加本地化的 Desktop 截图操作与捕获状态。"
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-screenshot

[English](README.md) | 中文

## 概述

`dsh-client-ui-screenshot` 在每个已创建的 Session 输入区注册截图操作。它通过 Desktop 截图 Remote 发送准确的 Session id 和本地化提示词，在截图期间禁用按钮，并显示取消、成功或失败状态。

## 目录

- [使用此 package](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此 package

在 Web Client 组合中加载它。Client 插件会先挂载生成的截图 Remote 贡献，再注册输入区操作，并在卸载时一并释放两者。它对 `remote.screenshotAssistant` 的注入要求会在截图 bundle 的 Host 端被禁用时让操作保持不可见。

-----

<a id="model-experience"></a>
## 模型体验

间接产生影响：Desktop 截图 Remote 把捕获的图片和本地化提示词作为 Session 用户消息接纳。

#### KV Cache 影响

每张被接纳的截图都会在可复用前缀之后增加一条用户消息。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 只有原生 Desktop provider 与 Host Remote 已连接时，此控件才可用。
- 初始控件使用默认的本地化分析提示词，不提供标注选项。

<a id="dev-note"></a>
### 开发备注

<details><summary>维护者工作上下文 — 点击展开</summary>

Remote 请求必须明确携带 Session 地址；当前输入区是目标 Session id 的唯一权威来源。

</details>
