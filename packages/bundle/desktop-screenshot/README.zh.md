---
description: "把公共输入插件、Desktop 截图、可配置投递和 Client UI 组合成一个原型 bundle。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-desktop-screenshot

[English](README.md) | 中文

## 概述

`dsh-desktop-screenshot` 是完整的原型组合。它的 patch 加载公共输入注册表、咪鼠 provider、截图键绑定、子进程 Bridge、原生截图 provider、剪贴板动作、目标注册表、默认 DSH Agent 目标、助手 Remote 和 Client 操作。

## 目录

- [使用此 package](#use-this-package)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用此 package

把 `cordis.patch.yml` 应用到 Desktop 拥有的 Web profile。启动前设置 `DSH_DESKTOP_SCREENSHOT=0`，可同时禁用原生 handler、Host provider、助手 Remote 和 Client 操作。设置 `DSH_MIMOUSE_SCREENSHOT=0` 只禁用咪鼠 provider。

在源码工作区开发时，为单次 Desktop 运行显式传入 `cordis.source.patch.yml`，使所有 package 都从当前 checkout 解析：

```sh
pnpm desktop:dev -- --patch ./packages/bundle/desktop-screenshot/cordis.source.patch.yml
```

正式分发时，打包并发布仓库的整个 `dsh` release family，然后只把最终 bundle 安装进原生 `desktop` profile：

```sh
pnpm run release:pack -- --family dsh --out dist/npm
dsh plugin --profile desktop add @deepseek-ai/dsh-desktop-screenshot
```

普通 `pnpm desktop:dev` 不加载这个源码 overlay。单独一个 bundle tarball 默认要求配置的 npm registry 已能提供其各个实现 package 的对应版本。发布之前若要全本地安装，必须通过本地 registry 或 pnpm overrides 提供这些依赖 tarball。使用 `dsh plugin --profile desktop remove @deepseek-ai/dsh-desktop-screenshot` 卸载；profile 管理器会删除 bundle 层，pnpm 会删除不再需要的依赖。

-----

<a id="model-experience"></a>
## 模型体验

间接产生影响：用户接受原生截图选择后，通过 Session prompt 接纳产生模型输入。

#### KV Cache 影响

每张被接纳的截图都会在可复用前缀之后增加一条带图片的用户消息。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

- Electron carrier 持有原生窗口和剪贴板权限；本 package 持有 Harness 插件图和 Client 资源可达性。
- 如果启用 Host bundle 但未连接 Desktop Bridge，截图会明确失败。
- OCR、ASR 长按行为、标注工具、多显示器截图和安装器构建仍不在已实现原型内。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作背景 — 点击展开</summary>

原生 carrier 和 Harness 组合保持分离，因为 Electron 持有操作系统权限，而 Host 插件持有设备归一化、业务动作、设置和 Agent 接纳。参见[桌面子系统](../../../docs/subsystems/desktop.zh.md)。

</details>
