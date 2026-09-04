---
description: "捕获 Desktop 区域，并通过用户设置所选的截图目标进行投递。"
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-assistant

[English](README.md) | 中文

## 概述

`dsh-screenshot-assistant` 负责协调交互式截图和投递。它在每次操作时读取用户的 `screenshot-assistant.targetId` 设置，并把捕获的 PNG 发送到该准确目标。默认 bundle 安装 `dsh-agent` 目标，由该目标通过现有 Session prompt 路径接纳图片和提示词。

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

只在 Desktop Host 组合中加载此插件。调用 `screenshotAssistant.capture` 时传入准确 Session id、非空 prompt 和标注选项。取消不会投递。成功调用只会在配置的目标接收图片后返回。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details><summary>实现内部细节 — 点击展开</summary>

助手只负责选择目标，不负责各目标的具体行为。`dsh-screenshot-target-dsh-agent` 单独调用 `sessionController.prompt`，从而保留图片模态检查、Attachment 持久化、持久消息日志和 Agent 恢复行为，同时避免所有目标都与 DSH Session 耦合。

</details>

-----

<a id="further-exploration"></a>
## 延伸阅读

- [截图定义](../screenshot/README.zh.md) — 捕获请求和 PNG 结果。
- [原型 package 清单](../../README.zh.md) — 独立安装的截图投递目标和最终组合。

-----

<a id="model-experience"></a>
## 模型体验

取决于所选目标。默认 DSH Agent 目标会把提供的文本和捕获图片记录为一条用户消息。

#### KV Cache 影响

每张被接纳的截图都会增加一条用户消息，并使先前缓存前缀之后的请求后缀失效。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- 调用方必须提供非空 prompt；默认 DSH Agent 目标还要求准确的 Session id。
- 设置命名空间已经实现，但图形设置页尚未加入目标选择控件。
- PNG 字节会在 Session 接纳前进行 base64 编码，产生临时内存开销。

<a id="dev-note"></a>
### 开发备注

<details><summary>维护者工作上下文 — 点击展开</summary>

目标插件拥有自己的投递保证。助手不得在已配置目标不可用时静默改投其他目标。

</details>
