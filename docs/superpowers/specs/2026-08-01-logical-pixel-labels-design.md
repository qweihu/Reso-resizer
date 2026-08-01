# Logical Pixel Labels Design

## Goal

Clarify that custom width and height are browser logical dimensions rather than physical screenshot pixels, while explaining the Retina 2x export behavior in all supported interface languages.

## Decision

Keep the existing numeric behavior unchanged. Chrome window sizing and viewport calculations continue to use browser logical pixels (CSS px/device-independent pixels). Replace the ambiguous `px` labels with localized logical-pixel wording and add a localized hint in the custom-resolution section:

- Chinese: `宽度（逻辑像素）`, `高度（逻辑像素）`, `截图导出尺寸会根据设备像素比放大，例如 Retina 2x 下 1280 × 900 会导出为 2560 × 1800。`
- Japanese: `幅（論理ピクセル）`, `高さ（論理ピクセル）`, with the equivalent Retina 2x explanation.
- English: `Width (logical pixels)`, `Height (logical pixels)`, with the equivalent Retina 2x explanation.

The term `pt` will not be used because it would imply a platform typographic unit and would not accurately describe the browser API dimensions.

## Scope

- Update the static fallback labels in `popup.html`.
- Update the three localized strings and validation wording in `popup.js`.
- Render the localized hint through the existing language application flow.
- Add a focused test for the localized logical-pixel copy source so future edits do not reintroduce ambiguous `px` wording.

## Verification

Run the existing Node test suite, JavaScript syntax checks, JSON parsing checks, and `git diff --check`. Manually switch the popup through Chinese, Japanese, and English, enter `1280 × 900` in custom mode, and confirm the hint explains the 2x physical export without changing the applied dimensions.
