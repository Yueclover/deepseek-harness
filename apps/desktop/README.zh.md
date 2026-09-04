---
description: "在安全 Electron 窗口中运行受支持的 Desktop profile，并提供通用 Windows 屏幕和剪贴板能力。"
kind: "package-reference"
---

# @deepseek-ai/dsh-desktop-app

[English](README.md) | 中文

## 概述

`dsh-desktop-app` 是原生 Electron 载体。它用 Electron 可执行文件的 Node 模式启动 `dsh --profile desktop`，通过 IPC 连接 Host 子进程，注册通用区域捕获和 PNG 剪贴板方法，并在沙箱 BrowserWindow 中加载带认证信息的 loopback Web Client。它不会把动态安装的代码加载到 Electron main。

## 使用此包

用一条命令构建仓库并启动源码应用：

```sh
pnpm desktop:dev
```

普通启动只应用 `desktop` profile 及其中已安装的 bundle，不应用任何开发插件 overlay。若只想为本次运行加载本地 overlay，可传入与 Web 启动器相同且可重复的 `--patch` 选项：

```sh
pnpm desktop:dev -- --patch ./scratch-plugin/cordis.yml
```

`pnpm desktop` 会直接启动已有构建，并接受相同的 `--patch` 选项。使用 `pnpm dsh plugin --profile desktop add <package>` 持久安装 bundle；使用对应的 `remove` 命令卸载。关闭窗口时会隐藏窗口，使全局输入继续工作；启动第二个实例会恢复现有窗口。退出应用会销毁原生捕获状态、bridge 和它持有的 Host 子进程。

## 理解实现

| 文件 | 职责 |
|---|---|
| [`src/main.ts`](src/main.ts) | Electron、BrowserWindow、Desktop profile 和子进程生命周期 |
| [`src/desktop-capabilities.ts`](src/desktop-capabilities.ts) | 通用 Desktop Bridge 屏幕和剪贴板处理器 |
| [`src/platform/win32/screen-capture.ts`](src/platform/win32/screen-capture.ts) | 主显示器选区蒙层、DPR 换算、裁剪和 PNG 输出 |
| [`src/child-process-transport.ts`](src/child-process-transport.ts) | 父端 endpoint transport |

此包不发布运行时 invariant companion：载体只持有一个子进程、一个 bridge 和一个窗口，这些关系不能独立漂移。

## 延伸阅读

- [桌面子系统](../../docs/subsystems/desktop.zh.md) — 包和进程归属。
- [桌面截图 bundle](../../packages/bundle/desktop-screenshot/README.zh.md) — 可安装业务组合。

## 模型体验

无，因为载体不添加提示词、schema、工具结果或 Session 消息。

#### KV Cache 影响

无；加载的 Host 插件负责各自影响。

## 已知限制与延期工作

- 首个支持目标是 Windows x64；尚未配置签名和安装器生产。
- 区域选择目前只覆盖主显示器，也没有标注工具。
- 后台运行还没有托盘菜单；关闭会隐藏窗口，终止进程仍是明确退出路径。

## 开发备注

无。
