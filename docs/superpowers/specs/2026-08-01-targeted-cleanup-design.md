# Reso-resizer 针对性重构设计

## 目标

在不引入框架、不改变现有界面和核心功能的前提下，修复截图流程缺陷，提升配置与持久化状态的可靠性，并让可验证的业务逻辑脱离 DOM 控制器。

## 范围

本次处理包含：

- 截图成功、截图失败和下载失败后，按钮都恢复可用；成功时显示明确的“已开始保存”状态。
- 对配置和用户状态做类型、范围和结构规范化。
- 将分辨率解析、状态规范化、配置规范化和 viewport 尺寸计算抽到可在 Node 中执行的纯模块。
- 保留一个精简的内置安全配置，不再复制完整 `config.json`。
- 恢复 preset 与 custom 两组字段，模式只决定当前显示哪一组。
- 保留现有原生 HTML/CSS/JS 技术栈，修复模式切换的键盘可操作性。
- 增加 Node 内置测试、MIT `LICENSE` 文件，并移除默认生产路径中的详细调试日志。

## 不在范围内

- 不引入 npm 依赖、构建工具或前端框架。
- 不重新设计 popup 的视觉布局。
- 不改变 Chrome 权限、截图文件命名规则或现有三种语言的文案体系。
- 不承诺在浏览器最大化、全屏或非 100% zoom 下实现超出 Chrome API 能力的精确 viewport 结果；这些条件会列入手动测试说明。

## 设计

### 文件职责

- `popup-core.mjs`：纯函数和数据规范化，不访问 DOM 或 Chrome API。
  - `parseResolution(value)`：只接受至少 100×100 的整数分辨率。
  - `normalizeState(rawState)`：将 storage 数据收敛为合法的 `mode`、宽高、preset 和 boolean 开关。
  - `normalizeConfig(rawConfig, fallbackConfig)`：校验预设分组、标签和尺寸；无效配置回退到安全配置。
  - `getViewportWindowSize(windowSize, viewportSize, targetSize)`：计算窗口模式下需要传给 `windows.update` 的尺寸。
- `popup.js`：popup 控制器，负责 DOM、i18n、Chrome API 调用和操作状态展示。
- `tests/popup-core.test.mjs`：使用 Node 内置 `node:test`，覆盖纯函数边界和修复后的状态约定。
- `config.json`：仍是正常运行时的唯一完整预设来源。
- `LICENSE`：完整 MIT 授权文本。

### 配置加载流程

1. 读取 `config.json` 并解析 JSON。
2. 用 `normalizeConfig` 检查语言、默认分辨率、预设分组和选项。
3. 配置无效、为空或读取失败时，使用精简安全配置并显示已有的加载错误提示。
4. 读取 storage 后通过 `normalizeState` 处理，再一次性恢复两组输入和当前模式。

### 状态模型

规范化后的状态固定包含：

```js
{
  mode: 'preset' | 'custom',
  presetResolution: string,
  customWidth: string,
  customHeight: string,
  viewportOnly: boolean
}
```

无效或缺失字段使用安全默认值；preset 是否仍存在由当前配置决定。恢复界面时始终恢复 preset 和 custom 两组字段，只根据 `mode` 切换可见区域。

### 截图流程

截图按钮点击后进入 loading 状态，依次调用 `captureVisibleTab` 和 `downloads.download`。成功时显示下载已开始；任一步骤失败时显示对应错误。整个流程使用 `finally` 恢复按钮和可继续操作的状态，避免任何提前返回路径留下 disabled 按钮。

### 可访问性

模式 radio 不再使用 `display: none`，而使用保留焦点能力的 visually-hidden 样式；补充 `:focus-visible` 样式，使键盘用户可以看到当前焦点。Viewport 开关保持原生 checkbox 的键盘语义。

## 测试策略

自动测试只覆盖不依赖浏览器的纯逻辑：

- 合法、非法、边界和非整数分辨率。
- 缺失、损坏和未知字段的 storage 状态。
- 空预设、缺少语言标签和无效默认分辨率的配置。
- viewport 外框差值计算。

手动测试覆盖：

1. 首次安装与 popup 重开后的默认状态。
2. preset/custom 两种模式分别输入后，关闭并重新打开 popup，确认两组值都保留。
3. 普通网页上的标准模式和 viewport-only 模式。
4. 连续点击截图两次，确认第一次完成后按钮恢复并可再次使用。
5. 截图保存对话框取消、Chrome 内部页、最大化/全屏和浏览器 zoom 场景。
6. 中文、日文、英文界面以及缺失配置时的安全 fallback。
7. 仅使用键盘完成模式切换、输入和应用操作。

## 验收标准

- 自动测试全部通过，`node --check popup.js`、JSON 解析和 `git diff --check` 通过。
- 截图操作不存在永久 disabled 或卡在 loading 文案的路径。
- 损坏 storage/config 不会导致 popup 无法初始化。
- `config.json` 的预设修改不再要求同步修改完整 fallback 数据。
- 手动测试清单可直接用于发布前回归。
