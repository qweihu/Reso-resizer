# Logical Pixel Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify custom resolution units as browser logical pixels and explain Retina export scaling in Chinese, Japanese, and English without changing resize behavior.

**Architecture:** Keep all dimension calculations and persisted values unchanged. Add one localized hint element to the existing custom-resolution section, populate it from the existing `i18n` dictionary in `applyLanguage`, and update the static fallback labels to match the runtime copy.

**Tech Stack:** Chrome Extension Manifest V3, vanilla HTML/CSS/JavaScript modules, Node.js built-in test runner.

## Global Constraints

- Do not rename or convert stored numeric values; they remain logical browser dimensions.
- Do not use `pt` in user-facing unit labels.
- Keep Chinese, Japanese, and English wording semantically equivalent.
- Preserve the existing dark popup layout and avoid introducing dependencies.

---

### Task 1: Add localized logical-pixel copy

**Files:**
- Modify: `popup.html:47-64`
- Modify: `popup.js:100-172, 215-230`
- Modify: `popup.css:150-180`
- Test: `tests/popup-core.test.mjs`

**Interfaces:**
- Consumes: Existing static custom-resolution labels and `applyLanguage` localization flow.
- Produces: A `.custom-resolution-hint` element whose text is set from `t.customResolutionHint` for all three supported languages.

- [ ] **Step 1: Write the failing test**

Add a small source-level test that reads `popup.js` and asserts the three localized dictionaries contain `customResolutionHint` and do not use `pt` for the custom width/height labels.

```js
import { readFileSync } from 'node:fs';

test('localized custom resolution copy explains logical pixels', () => {
  const source = readFileSync(new URL('../popup.js', import.meta.url), 'utf8');

  assert.match(source, /width: '宽度（逻辑像素）'/);
  assert.match(source, /width: '幅（論理ピクセル）'/);
  assert.match(source, /width: 'Width \(logical pixels\)'/);
  assert.match(source, /customResolutionHint: '.*Retina 2x/);
  assert.doesNotMatch(source, /width: '[^']*pt/i);
  assert.doesNotMatch(source, /height: '[^']*pt/i);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/popup-core.test.mjs`

Expected: FAIL because `customResolutionHint` is not yet present in the localized source.

- [ ] **Step 3: Implement the localized labels and hint**

In `popup.html`, use logical-pixel fallback labels and add:

```html
<p class="custom-resolution-hint" aria-live="polite">
  截图导出尺寸会根据设备像素比放大，例如 Retina 2x 下 1280 × 900 会导出为 2560 × 1800。
</p>
```

In each `i18n` language object, set:

```js
width: '宽度（逻辑像素）',
height: '高度（逻辑像素）',
customResolutionHint: '截图导出尺寸会根据设备像素比放大，例如 Retina 2x 下 1280 × 900 会导出为 2560 × 1800。'
```

Use equivalent Japanese and English translations. In `applyLanguage`, set `document.querySelector('.custom-resolution-hint').textContent = t.customResolutionHint;` alongside the existing labels.

In `popup.css`, style `.custom-resolution-hint` as a small muted, readable paragraph with a compact top margin and line height so it remains visually subordinate to the inputs.

- [ ] **Step 4: Run the tests and checks**

Run:

```bash
node --test tests/popup-core.test.mjs
node --check popup.js
node --check popup-core.mjs
node -e "JSON.parse(require('fs').readFileSync('manifest.json')); JSON.parse(require('fs').readFileSync('config.json'))"
git diff --check
```

Expected: all tests pass, both JavaScript files pass syntax checks, both JSON files parse, and the diff has no whitespace errors.

- [ ] **Step 5: Manually verify all locales**

Open the extension popup, switch the UI language through Chinese, Japanese, and English, enter `1280 × 900` in custom mode, and confirm the labels describe logical pixels and the hint explains that Retina 2x output is `2560 × 1800`. Click Apply Resolution once in each locale to confirm the numeric resize behavior remains unchanged.

- [ ] **Step 6: Commit**

```bash
git add popup.html popup.js tests/popup-core.test.mjs docs/superpowers/specs/2026-08-01-logical-pixel-labels-design.md docs/superpowers/plans/2026-08-01-logical-pixel-labels-plan.md
git commit -m "docs: clarify logical pixel resolution labels"
```
