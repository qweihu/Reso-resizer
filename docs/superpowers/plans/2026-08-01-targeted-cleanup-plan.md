# Reso-resizer 针对性重构 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复截图流程和状态恢复问题，抽离可测试的纯逻辑，增强配置容错，同时保持原生 MV3 扩展的现有功能和界面。

**Architecture:** 新增无 DOM、无 Chrome API 依赖的 `popup-core.mjs`，集中处理分辨率、状态、配置和截图流程的纯逻辑；`popup.js` 保持为 DOM/Chrome API 控制器，并通过 ES module 导入核心函数。`config.json` 仍是完整运行时配置，核心模块只保存精简安全 fallback。

**Tech Stack:** Chrome Manifest V3、原生 HTML/CSS/JavaScript、Node.js 内置 `node:test`，不新增 npm 依赖或构建步骤。

## Global Constraints

- 不引入前端框架、构建工具或运行时依赖。
- 不改变现有 popup 布局、权限、文件命名规则和中/日/英三种语言。
- 每个纯函数先写失败测试，再写最小实现。
- Chrome API 的 UI 集成路径通过 `node --check`、静态检查和手动 smoke test 验证。
- 不修改用户现有的 storage key：继续使用 `userState`。

---

### Task 1: 建立可测试的核心数据模块

**Files:**
- Create: `popup-core.mjs`
- Create: `tests/popup-core.test.mjs`

**Interfaces:**
- Produces `parseResolution(value) -> { width: number, height: number } | null`。
- Produces `normalizeState(rawState, presetValues) -> State`，其中 `State` 固定包含 `mode`、`presetResolution`、`customWidth`、`customHeight`、`viewportOnly`。
- Produces `normalizeConfig(rawConfig, fallbackConfig) -> { config, usedFallback }`。
- Produces `getViewportWindowSize(windowSize, viewportSize, targetSize) -> { width, height }`。
- Produces `runCapture(capture, download) -> Promise<void>`，负责保证截图数据先产生，再交给下载函数。

- [ ] **Step 1: Write failing tests for resolution and viewport behavior**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getViewportWindowSize,
  parseResolution,
  runCapture
} from '../popup-core.mjs';

test('parseResolution accepts integer dimensions at the 100px boundary', () => {
  assert.deepEqual(parseResolution('100x200'), { width: 100, height: 200 });
});

test('parseResolution rejects malformed, fractional, and undersized values', () => {
  assert.equal(parseResolution('99x200'), null);
  assert.equal(parseResolution('100.5x200'), null);
  assert.equal(parseResolution('200'), null);
});

test('getViewportWindowSize adds the measured browser chrome difference', () => {
  assert.deepEqual(
    getViewportWindowSize(
      { width: 1200, height: 900 },
      { width: 1180, height: 820 },
      { width: 1000, height: 700 }
    ),
    { width: 1020, height: 780 }
  );
});

test('runCapture passes the captured data to download', async () => {
  const calls = [];
  await runCapture(
    async () => { calls.push('capture'); return 'data:image/png;base64,test'; },
    async (dataUrl) => { calls.push(['download', dataUrl]); }
  );
  assert.deepEqual(calls, ['capture', ['download', 'data:image/png;base64,test']]);
});

test('runCapture does not download when capture fails', async () => {
  let downloadCalled = false;
  await assert.rejects(
    runCapture(
      async () => { throw new Error('capture failed'); },
      async () => { downloadCalled = true; }
    ),
    /capture failed/
  );
  assert.equal(downloadCalled, false);
});

test('runCapture propagates download failures', async () => {
  await assert.rejects(
    runCapture(
      async () => 'data:image/png;base64,test',
      async () => { throw new Error('download failed'); }
    ),
    /download failed/
  );
});
```

- [ ] **Step 2: Run the focused test file and verify the failure is meaningful**

Run: `node --test tests/popup-core.test.mjs`

Expected: FAIL because `popup-core.mjs` does not exist yet, rather than a test syntax error.

- [ ] **Step 3: Write the minimal core implementations**

Implement `parseResolution` with the existing `^(\d+)x(\d+)$` contract and a 100px lower bound. Implement viewport sizing as `target + (window - viewport)`. Implement `runCapture` as two awaited calls without swallowing errors.

- [ ] **Step 4: Add state and config normalization tests before their implementations**

```js
import {
  normalizeConfig,
  normalizeState
} from '../popup-core.mjs';

test('normalizeState restores both modes and rejects an unknown mode', () => {
  const state = normalizeState(
    {
      mode: 'unexpected',
      presetResolution: '390x844',
      customWidth: '1280',
      customHeight: '720',
      viewportOnly: true
    },
    ['1440x900', '390x844']
  );
  assert.deepEqual(state, {
    mode: 'preset',
    presetResolution: '390x844',
    customWidth: '1280',
    customHeight: '720',
    viewportOnly: true
  });
});

test('normalizeState supplies valid defaults for missing or invalid fields', () => {
  assert.deepEqual(normalizeState({ customWidth: 'bad' }, ['1440x900']), {
    mode: 'preset',
    presetResolution: '1440x900',
    customWidth: '1920',
    customHeight: '1080',
    viewportOnly: false
  });
});

test('normalizeConfig falls back when presets are empty or malformed', () => {
  const fallback = {
    language: 'auto',
    defaultResolution: '1440x900',
    defaultViewportOnly: false,
    presets: [{
      group: { zh: '常用', ja: 'よく使う', en: 'Common' },
      options: [{
        value: '1440x900',
        label: { zh: '1440 × 900', ja: '1440 × 900', en: '1440 × 900' }
      }]
    }]
  };
  const result = normalizeConfig({ presets: [] }, fallback);
  assert.equal(result.usedFallback, true);
  assert.deepEqual(result.config, fallback);
});
```

- [ ] **Step 5: Run the new tests to verify the new cases fail**

Run: `node --test tests/popup-core.test.mjs`

Expected: the new state/config tests fail because their exports and normalization behavior are not implemented yet.

- [ ] **Step 6: Implement `normalizeState` and `normalizeConfig` minimally**

Use `mode === 'custom'` as the only custom mode, preserve both custom dimensions when valid integers at least 100, choose the first valid preset when the saved preset no longer exists, and treat non-boolean `viewportOnly` as `false`. A config is usable only when it has at least one group with at least one valid resolution option and each option has a multilingual label object; otherwise return the supplied fallback with `usedFallback: true`.

- [ ] **Step 7: Run the focused tests and confirm all core behavior passes**

Run: `node --test tests/popup-core.test.mjs`

Expected: PASS for all tests with no warnings.

- [ ] **Step 8: Commit the core module and tests**

```bash
git add popup-core.mjs tests/popup-core.test.mjs
git commit -m "test: add validated popup core logic"
```

### Task 2: Integrate config and persisted state into the popup controller

**Files:**
- Modify: `popup.html:95`
- Modify: `popup.js:1-126,266-432`

**Interfaces:**
- Consumes the exports from `popup-core.mjs`.
- `loadConfig` passes loaded data through `normalizeConfig` before rendering.
- `renderPresets` normalizes the saved state once, then restores preset, custom dimensions, viewport toggle and mode independently.

- [ ] **Step 1: Convert the popup script to an ES module and import the core functions**

Change the script tag to `<script type="module" src="popup.js"></script>` and import the named exports from `./popup-core.mjs`. Move the compact safe fallback into `popup-core.mjs`; remove the full duplicated preset list from `popup.js`.

- [ ] **Step 2: Normalize config and state at their boundaries**

After JSON parsing, call `normalizeConfig(rawConfig, SAFE_FALLBACK_CONFIG)`. When `usedFallback` is true, use the existing localized load error. In the storage callback, pass the returned object (or `null`) to `normalizeState` using the currently loaded preset values. `renderPresets` must always assign both `presetSelect.value` and the two custom input values, then toggle sections based only on the normalized mode.

- [ ] **Step 3: Run syntax, JSON, and focused tests**

Run: `node --test tests/popup-core.test.mjs && node --check popup.js && node -e "JSON.parse(require('fs').readFileSync('manifest.json')); JSON.parse(require('fs').readFileSync('config.json'))"`

Expected: all tests pass and both syntax/JSON checks exit successfully.

- [ ] **Step 4: Commit the config/state integration**

```bash
git add popup.html popup.js popup-core.mjs tests/popup-core.test.mjs
git commit -m "fix: normalize popup config and saved state"
```

### Task 3: Fix screenshot lifecycle and popup accessibility

**Files:**
- Modify: `popup.js:149-220,236-256,567-607`
- Modify: `popup.css:70-96,201-249`

**Interfaces:**
- Consumes `runCapture` from `popup-core.mjs`.
- Every screenshot path restores the button in `finally`.
- The existing capture and save error messages remain localized; success adds a localized “download started” message.

- [ ] **Step 1: Implement the minimal popup lifecycle fix**

Replace the nested early-return capture flow with one `try/catch/finally`: call `runCapture`, set the localized success message after download creation, map errors to capture/save messages, and always call `setCaptureButtonState(t.captureBtn, false)` in `finally`.

- [ ] **Step 2: Preserve keyboard focusability for mode controls**

Replace `display: none` on mode radios with a visually-hidden absolute-position style, add `:focus-visible` feedback to the selected tab, and keep the native checkbox focusable. Avoid changing the visible layout.

- [ ] **Step 3: Run tests and static checks**

Run: `node --test tests/popup-core.test.mjs && node --check popup.js`

Expected: PASS with no syntax errors.

- [ ] **Step 4: Commit the screenshot and accessibility fixes**

```bash
git add popup.js popup.css popup-core.mjs tests/popup-core.test.mjs
git commit -m "fix: restore capture lifecycle and keyboard access"
```

### Task 4: Release consistency and cleanup

**Files:**
- Create: `LICENSE`
- Modify: `README.md:50-60,109-119`
- Modify: `README.ja.md` corresponding configuration/license sections
- Modify: `popup.js:63-126,236-255`
- Modify: `config.json:3-5`

- [ ] **Step 1: Add the complete MIT license text**

Create a root `LICENSE` with the MIT license and the project copyright holder as `Reso-resizer contributors`.

- [ ] **Step 2: Align documentation with implementation**

Explain that language auto-detection uses `navigator.language`, mention that saved preset and custom values are both restored, and link the MIT license from both localized READMEs.

- [ ] **Step 3: Remove noisy default storage logs and reduce duplicated button markup**

Remove routine `console.log` calls that print full user state; retain `console.error` for actual failures. Keep button SVGs in the HTML and update only their label text through stable elements or one shared helper.

- [ ] **Step 4: Run final static checks**

Run: `node --test tests/popup-core.test.mjs && node --check popup.js && node -e "JSON.parse(require('fs').readFileSync('manifest.json')); JSON.parse(require('fs').readFileSync('config.json'))" && git diff --check`

Expected: all commands succeed without output errors.

- [ ] **Step 5: Commit release consistency changes**

```bash
git add LICENSE README.md README.ja.md popup.js config.json
git commit -m "chore: align release metadata and popup cleanup"
```

### Task 5: Manual verification and review

**Files:**
- Read-only verification of the extension in Chrome.

- [ ] **Step 1: Load the unpacked extension and verify first-run defaults**

Open `chrome://extensions`, reload the unpacked extension, open the popup, and confirm preset mode is selected, the default preset is available, custom inputs show `1920` and `1080` when selected, and buttons become enabled after config loading.

- [ ] **Step 2: Verify persistence across modes**

Enter custom `1280 × 720`, switch to preset `390 × 844`, toggle viewport-only, close and reopen the popup. Confirm both custom values and preset selection remain intact and the last mode/toggle are restored.

- [ ] **Step 3: Verify standard and viewport-only resizing on a normal webpage**

Use a normal HTTP(S) page. Apply a preset in standard mode and then a custom size in viewport-only mode. Confirm the browser window changes and the page viewport is close to the requested target.

- [ ] **Step 4: Verify screenshot repeatability and cancellation**

Click capture, complete the save dialog, confirm a success message and that the button is enabled again; click capture a second time. Repeat and cancel the save dialog, confirming the button also recovers.

- [ ] **Step 5: Verify restricted and edge environments**

Try viewport-only mode on a Chrome internal page, then test a maximized window, fullscreen state, and non-100% zoom. Confirm failures are reported clearly and the popup remains usable.

- [ ] **Step 6: Verify language and keyboard access**

Test Chinese, Japanese, and English browser languages. Use Tab/Shift+Tab and Enter/Space to switch modes, toggle viewport-only, and activate buttons; confirm a visible focus indicator exists.

- [ ] **Step 7: Request final read-only code review**

Use the complete implementation commit range and check the diff for regressions, duplicated configuration, unhandled promise paths, and test coverage. Resolve any Critical or Important findings before reporting completion.
