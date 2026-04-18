# Reso-resizer / レゾリサイズ

[日本語版 README](./README.ja.md)

## 中文

还在为截图尺寸不统一而发愁吗？这是给强迫症产品经理和开发者准备的 Chrome 插件。

Reso-resizer（レゾリサイズ）是一个极简的浏览器窗口尺寸调整工具，可以一键把浏览器窗口改成精确分辨率，用来统一截图规范或模拟不同设备显示效果。

### 功能特点

- 像素级精准控制：输入目标分辨率，浏览器窗口会精确调整到位。
- 预置和自定义双模式：可直接选择 MacBook、iPhone、iPad 等常用分辨率，也可以手动输入任意宽高。
- 智能 Viewport 模式：只调整网页可视区域尺寸，自动排除工具栏、地址栏等浏览器界面占用空间。
- 原生多语言支持：根据浏览器语言自动切换中文、日语和英文。
- 配置文件驱动：所有预置分辨率集中放在 `config.json` 中，维护时不需要改代码。

### 工作原理

- 标准模式：直接通过 Chrome API 调整整个浏览器窗口大小。
- Viewport 模式：
  - 通过 `innerWidth` 和 `innerHeight` 获取当前网页可视区域尺寸。
  - 计算浏览器边框和工具栏占用的额外空间。
  - 自动补偿这些空间，让网页内容区域最终准确匹配目标分辨率。

### 安装使用

1. 下载或克隆本仓库。
2. 打开 Chrome，进入 `chrome://extensions/`。
3. 开启右上角的 `开发者模式`。
4. 点击 `加载已解压的扩展程序`，选择当前项目目录。
5. 点击浏览器工具栏中的 Reso-resizer 图标开始使用。

### 配置说明

所有配置都在 `config.json` 中。

- 在 `presets` 数组中添加或修改预置分辨率。
- 用 `defaultResolution` 修改默认分辨率。
- 将 `defaultViewportOnly` 设为 `true` 可默认开启 Viewport 模式。

### 开源协议

MIT License。

---

## English

Tired of inconsistent screenshot sizes? A blessing for perfectionist product managers and developers.

Reso-resizer (レゾリサイズ) is a minimalist Chrome extension for pixel-perfect browser resizing. With one click, you can resize your browser window to an exact resolution for standardized screenshots or device display simulation.

### Features

- Pixel-perfect control: Enter a target resolution and resize the browser window precisely.
- Preset and custom modes: Choose common resolutions such as MacBook, iPhone, and iPad, or enter any width and height manually.
- Smart viewport mode: Resize only the webpage viewport while automatically excluding browser UI such as toolbars and the address bar.
- Native multilingual support: Automatically switches between Chinese, Japanese, and English based on the browser language.
- Configuration-driven presets: Manage all preset resolutions centrally in `config.json` without changing code.

### How It Works

- Standard mode: Uses the Chrome API to resize the full browser window directly.
- Viewport mode:
  - Reads the current webpage viewport size with `innerWidth` and `innerHeight`.
  - Calculates the extra space taken by browser chrome.
  - Applies compensation so the visible content area matches the target resolution exactly.

### Installation

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable `Developer mode`.
4. Click `Load unpacked` and select this project folder.
5. Click the Reso-resizer icon in the browser toolbar.

### Configuration

All configuration is stored in `config.json`.

- Add or modify preset resolutions in the `presets` array.
- Change the default resolution with `defaultResolution`.
- Enable viewport mode by default with `defaultViewportOnly: true`.

### License

MIT License.
