---
description: "注册命名截图投递目标，并解析用户设置中准确选择的目标。"
kind: "package-reference"
---

# @deepseek-ai/dsh-screenshot-target

[English](README.md) | 中文

## 概述

`dsh-screenshot-target` 持有截图助手使用的实时目标注册表。每个目标以 id、显示名称和异步 `send` 方法独立注册。配置的目标缺失时会明确失败；注册表不会替换成其他目标。

## 目录

- [使用此包](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

<a id="use-this-package"></a>
## 使用此包

在目标 provider 和截图助手之前加载一个注册表。provider 通过 `ctx.effect` 持有注册 disposer；设置把 branded target id 存储为字符串。

<a id="model-experience"></a>
## 模型体验

通过所选目标间接影响模型；该目标负责所有模型可见的投递。

#### KV Cache 影响

注册表本身没有缓存影响。

<a id="known-limitations-and-deferred-work"></a>
## 已知限制与延期工作

- 目标枚举只存在于当前进程，还没有设置页 Remote。
- 投递重试和持久性由各目标 provider 自己负责。

<a id="dev-note"></a>
### 开发备注

无。
