const MIN_DIMENSION = 100;
const SUPPORTED_LANGUAGES = new Set(['auto', 'zh', 'ja', 'en']);
const UI_LANGUAGES = ['zh', 'ja', 'en'];

export const SAFE_FALLBACK_CONFIG = {
  language: 'auto',
  defaultResolution: '1440x900',
  defaultViewportOnly: false,
  presets: [
    {
      group: { zh: '常用', ja: 'よく使う', en: 'Common' },
      options: [
        { value: '1440x900', label: { zh: '1440 × 900', ja: '1440 × 900', en: '1440 × 900' } },
        { value: '1920x1080', label: { zh: '1920 × 1080', ja: '1920 × 1080', en: '1920 × 1080' } },
        { value: '1366x768', label: { zh: '1366 × 768', ja: '1366 × 768', en: '1366 × 768' } }
      ]
    }
  ]
};

export const parseResolution = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d+)x(\d+)$/);
  if (!match) return null;

  const width = Number.parseInt(match[1], 10);
  const height = Number.parseInt(match[2], 10);

  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < MIN_DIMENSION ||
    height < MIN_DIMENSION
  ) {
    return null;
  }

  return { width, height };
};

const normalizeDimension = (value, fallback) => {
  const normalized = typeof value === 'number' ? String(value) : value;
  if (typeof normalized !== 'string') return fallback;

  return parseResolution(`${normalized}x${MIN_DIMENSION}`) ? normalized : fallback;
};

export const normalizeState = (
  rawState,
  presetValues = [],
  configuredDefaultPreset = '1440x900'
) => {
  const state = rawState && typeof rawState === 'object' ? rawState : {};
  const validPresets = Array.isArray(presetValues)
    ? presetValues.filter((value) => parseResolution(value))
    : [];
  const defaultPreset = validPresets.includes(configuredDefaultPreset)
    ? configuredDefaultPreset
    : validPresets[0] || '1440x900';

  return {
    mode: state.mode === 'custom' ? 'custom' : 'preset',
    presetResolution: validPresets.includes(state.presetResolution)
      ? state.presetResolution
      : defaultPreset,
    customWidth: normalizeDimension(state.customWidth, '1920'),
    customHeight: normalizeDimension(state.customHeight, '1080'),
    viewportOnly: state.viewportOnly === true
  };
};

const hasLanguageMap = (value) => (
  value &&
  UI_LANGUAGES.every((language) => typeof value[language] === 'string' && value[language].trim())
);

const isUsableConfig = (config) => {
  if (!config || typeof config !== 'object') return false;
  if (!SUPPORTED_LANGUAGES.has(config.language)) return false;
  if (!parseResolution(config.defaultResolution)) return false;
  if (typeof config.defaultViewportOnly !== 'boolean') return false;
  if (!Array.isArray(config.presets) || config.presets.length === 0) return false;

  const presetValues = [];
  for (const presetGroup of config.presets) {
    if (!hasLanguageMap(presetGroup?.group)) return false;
    if (!Array.isArray(presetGroup.options) || presetGroup.options.length === 0) return false;

    for (const option of presetGroup.options) {
      if (!parseResolution(option?.value) || !hasLanguageMap(option?.label)) {
        return false;
      }
      presetValues.push(option.value);
    }
  }

  return presetValues.includes(config.defaultResolution);
};

export const normalizeConfig = (rawConfig, fallbackConfig) => {
  if (!isUsableConfig(rawConfig)) {
    return { config: fallbackConfig, usedFallback: true };
  }

  return { config: rawConfig, usedFallback: false };
};

export const getViewportWindowSize = (windowSize, viewportSize, targetSize) => ({
  width: targetSize.width + (windowSize.width - viewportSize.width),
  height: targetSize.height + (windowSize.height - viewportSize.height)
});

export const resizeWindow = async ({
  currentWindow,
  targetDimensions,
  viewportOnly,
  measureViewport,
  updateWindow
}) => {
  let windowSize = targetDimensions;

  if (viewportOnly) {
    const currentViewport = await measureViewport();
    if (!currentViewport?.innerWidth || !currentViewport?.innerHeight) {
      throw new Error('Viewport measurement failed');
    }

    windowSize = getViewportWindowSize(
      { width: currentWindow.width, height: currentWindow.height },
      { width: currentViewport.innerWidth, height: currentViewport.innerHeight },
      targetDimensions
    );
  }

  await updateWindow(currentWindow.id, windowSize);
};

export const runCapture = async (capture, download) => {
  const dataUrl = await capture();
  await download(dataUrl);
};
