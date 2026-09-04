# Agent Note：桌面能力与截图 bundle

Status: implemented

[English](2026-09-04-desktop-capabilities-and-screenshot-bundle.md) | 中文

## 问题

截图助手需要 Windows 屏幕像素、剪贴板访问和私有 HID 接口，但动态安装的 Cordis 包运行在 Harness Host 和 Client 中，而不是 Electron main 中。把每个内部类都做成可安装插件，还会把实现碎片暴露为用户管理单元，并让未来助手重复输入计时逻辑。

只用于 scratch 的包目录可以演示功能，却绕过仓库的包发现、发布约束、profile 安装、Client bundling 和 Remote 产物生成。为所有构建工具增加另一个包根目录会产生第二套插件协议，而不是使用现有协议。

## 决策

`apps/desktop` 是固定的 Electron 载体。它把受支持的 `desktop` profile 作为自己持有的 Host 子进程启动，呈现现有 Web Client，并只通过 `dsh-desktop-bridge` 暴露通用操作系统方法：交互式区域捕获和 PNG 剪贴板写入。动态安装的包不会在 Electron main 中执行。

可复用 Cordis 包位于 `packages/desktop`。`dsh-desktop-input` 合并归一化设备事件、动态物理绑定、短按识别、长按识别和语义动作分发，因为这些注册共享一个活动按压周期和一个冲突域。硬件 provider 表示完整设备协议，而不是每个按键一个包；米鼠 provider 目前只发布已捕获协议的 `mimouse.screenshot` 控制，不包含截图业务行为。

截图能力、Desktop provider、目标注册表、DSH Agent 目标、助手编排和 Client UI 在 provider 或 consumer 角色可独立演进之处保持为独立包。助手在运行时贡献截图动作和默认物理绑定。硬件触发的捕获复制到剪贴板；输入框 Remote 携带准确 Session id，并通过配置的目标发送。

`@deepseek-ai/dsh-desktop-screenshot` 是面向用户的安装单元。它导出的 `cordis.patch.yml` 组合所有必需的 Host 和 Client 包，普通 npm 依赖负责安装这些实现包。只用于源码的 `cordis.source.patch.yml` 支持仓库开发，但不会发布。安装和卸载由原生 `dsh plugin --profile desktop add/remove` 负责。

## 考虑过的替代方案

- **让 Electron main 动态加载功能包。** 仓库没有相应的生命周期、权限、隔离或打包协议，通用屏幕和剪贴板操作也不需要新增这套协议。
- **为每个注册表、手势和按键发布一个可安装包。** 这些单元不能独立提供有用行为，还会迫使用户管理内部依赖图。
- **把截图业务代码放进 Electron 应用。** 这会阻止 profile 安装、Client 发现、目标替换以及其他桌面业务插件复用。
- **把 `scratch-plugin` 保留为第二个工作区根目录。** 这会要求 TypeScript 别名、Typert 发现、Client bundling、测试和发布工具永久保留例外。

## 结果

- 正式包参与现有 workspace、Host/Client 构建面、发布校验和 bundle 安装，不需要新插件协议。
- 未来文本或语音助手可复用 Desktop Bridge 和 Desktop input，同时持有自己的动作与绑定。捕获到协议 fixture 后，其他米鼠按键扩展同一个硬件 provider。
- Electron 应用仍是单独交付的客户端壳。已经实现 Windows x64、主显示器选择和后台隐藏窗口；多显示器选择、标注、OCR、ASR、托盘 UI、签名和安装器生产仍是明确的后续工作。
- 被替代的 scratch package 构建记录已删除，因为额外包根目录的决策不属于已实现架构。
