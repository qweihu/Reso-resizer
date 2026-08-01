import {
  SAFE_FALLBACK_CONFIG,
  normalizeConfig,
  normalizeState,
  parseResolution,
  resizeWindow,
  runCapture
} from './popup-core.mjs';

// ==================== Storage Manager ====================
const STORAGE_KEY = 'userState';

const getDefaultState = () => ({
  mode: 'preset',
  presetResolution: null,
  customWidth: '1920',
  customHeight: '1080',
  viewportOnly: false
});

const saveUserState = (state) => {
  try {
    const stateToSave = {
      ...getDefaultState(),
      ...state
    };
    chrome.storage.local.set({ [STORAGE_KEY]: stateToSave }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Storage] Save error:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('[Storage] Failed to save user state:', error);
  }
};

const loadUserState = (callback) => {
  try {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[Storage] Load error:', chrome.runtime.lastError);
        callback(null);
        return;
      }
      
      if (result[STORAGE_KEY]) {
        const mergedState = { ...getDefaultState(), ...result[STORAGE_KEY] };
        callback(mergedState);
      } else {
        callback(null);
      }
    });
  } catch (error) {
    console.error('[Storage] Failed to load user state:', error);
    callback(null);
  }
};

const saveCurrentState = () => {
  const modeRadio = document.querySelector('input[name="mode"]:checked');
  if (!modeRadio) {
    console.warn('[Storage] No mode radio button checked');
    return;
  }
  
  const stateToSave = {
    mode: modeRadio.value,
    presetResolution: document.getElementById('preset-select').value,
    customWidth: document.getElementById('custom-width').value,
    customHeight: document.getElementById('custom-height').value,
    viewportOnly: document.getElementById('viewport-only').checked
  };
  
  saveUserState(stateToSave);
};
// ==================== Storage Manager End ====================

document.addEventListener('DOMContentLoaded', () => {
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const presetSection = document.getElementById('preset-section');
  const customSection = document.getElementById('custom-section');
  const presetSelect = document.getElementById('preset-select');
  const customWidth = document.getElementById('custom-width');
  const customHeight = document.getElementById('custom-height');
  const applyBtn = document.getElementById('apply-btn');
  const captureBtn = document.getElementById('capture-btn');
  const viewportOnlyCheckbox = document.getElementById('viewport-only');
  const statusMessage = document.getElementById('status-message');
  const html = document.documentElement;

  const getBrowserLang = () => {
    const lang = navigator.language || navigator.userLanguage || 'en';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  };

  const i18n = {
    zh: {
      appTitle: 'Reso-resizer',
      preset: '预置',
      custom: '自定义',
      selectResolution: '选择分辨率',
      width: '宽度（逻辑像素）',
      height: '高度（逻辑像素）',
      customResolutionHint: '截图导出尺寸会根据设备像素比放大，例如 Retina 2x 下 1280 × 900 会导出为 2560 × 1800。',
      viewportTitle: '仅网页可视区域 (Viewport)',
      viewportDesc: '不包含工具栏、地址栏和书签栏',
      applyBtn: '应用分辨率',
      captureBtn: '截图并保存 Viewport',
      loadingConfig: '正在加载配置…',
      applying: '正在调整窗口大小…',
      capturing: '正在截取当前 Viewport…',
      applySuccess: '分辨率已应用。',
      captureSuccess: '截图已开始保存。',
      captureStepError: '截图失败：',
      saveStepError: '保存失败：',
      invalidInput: '请输入有效的宽度和高度（最小限制为 100 个逻辑像素）。',
      invalidPreset: '当前预置分辨率无效，请重新选择。',
      viewportError: '无法访问当前页面进行精准计算。请在普通网页中使用，Chrome 内部页面和扩展页不受支持。',
      resizeError: '调整窗口大小失败。请确认当前窗口不是最小化、全屏或受系统限制状态。',
      captureError: '截图或保存失败。请确认当前标签页可见，并允许系统弹出保存对话框。',
      loadError: '配置文件不可用，已自动切换为内置安全预设。'
    },
    ja: {
      appTitle: 'レゾリサイズ',
      preset: 'プリセット',
      custom: 'カスタム',
      selectResolution: '解像度を選択',
      width: '幅（論理ピクセル）',
      height: '高さ（論理ピクセル）',
      customResolutionHint: 'スクリーンショットの出力サイズはデバイスピクセル比に応じて拡大されます。Retina 2x では 1280 × 900 が 2560 × 1800 で出力されます。',
      viewportTitle: 'ビューポートのみ',
      viewportDesc: 'ツールバー、アドレスバー、ブックマークバーを含まない',
      applyBtn: '解像度を適用',
      captureBtn: 'ビューポートを保存',
      loadingConfig: '設定を読み込み中…',
      applying: 'ウィンドウサイズを調整中…',
      capturing: '現在のビューポートをキャプチャ中…',
      applySuccess: '解像度を適用しました。',
      captureSuccess: 'スクリーンショットの保存を開始しました。',
      captureStepError: 'キャプチャ失敗: ',
      saveStepError: '保存失敗: ',
      invalidInput: '有効な幅と高さを入力してください（最小100論理ピクセル）。',
      invalidPreset: '現在のプリセット解像度が無効です。選び直してください。',
      viewportError: '現在のページにアクセスできないため、正確な計算ができません。通常のウェブページでお試しください。',
      resizeError: 'ウィンドウサイズの変更に失敗しました。最小化、全画面、またはOS制限の状態をご確認ください。',
      captureError: 'キャプチャまたは保存に失敗しました。現在のタブが表示中で、保存ダイアログが許可されているか確認してください。',
      loadError: '設定ファイルを読み込めなかったため、内蔵の安全なプリセットに切り替えました。'
    },
    en: {
      appTitle: 'Reso-resizer',
      preset: 'Preset',
      custom: 'Custom',
      selectResolution: 'Select Resolution',
      width: 'Width (logical pixels)',
      height: 'Height (logical pixels)',
      customResolutionHint: 'Screenshot output is scaled by the device pixel ratio; on Retina 2x, 1280 × 900 exports as 2560 × 1800.',
      viewportTitle: 'Viewport Only',
      viewportDesc: 'Excludes toolbar, address bar, and bookmarks bar',
      applyBtn: 'Apply Resolution',
      captureBtn: 'Capture Viewport',
      loadingConfig: 'Loading configuration...',
      applying: 'Resizing browser window...',
      capturing: 'Capturing current viewport...',
      applySuccess: 'Resolution applied.',
      captureSuccess: 'Download started.',
      captureStepError: 'Capture failed: ',
      saveStepError: 'Save failed: ',
      invalidInput: 'Please enter valid width and height (minimum 100 logical pixels).',
      invalidPreset: 'The selected preset is invalid. Please choose another one.',
      viewportError: 'Cannot access the current page for precise calculation. Use this on a regular webpage, not on Chrome internal or extension pages.',
      resizeError: 'Failed to resize the browser window. Make sure the window is not minimized, fullscreen, or blocked by system restrictions.',
      captureError: 'Failed to capture or save the screenshot. Make sure the active tab is visible and the save dialog is allowed.',
      loadError: 'The config file could not be loaded, so the extension switched to safe built-in presets.'
    }
  };

  let currentLang = getBrowserLang();
  let t = i18n[currentLang];
  let isConfigLoaded = false;

  const resolveLanguage = (configLanguage) => {
    if (configLanguage === 'zh' || configLanguage === 'ja' || configLanguage === 'en') {
      return configLanguage;
    }

    return getBrowserLang();
  };

  const setButtonState = (label, disabled) => {
    applyBtn.disabled = disabled;
    applyBtn.querySelector('.button-label').textContent = label;
  };

  const setCaptureButtonState = (label, disabled) => {
    captureBtn.disabled = disabled;
    captureBtn.querySelector('.button-label').textContent = label;
  };

  const setStatus = (message, tone = '') => {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    if (tone) {
      statusMessage.classList.add(`is-${tone}`);
    }
  };

  const getErrorMessage = (error, fallback) => {
    const message =
      error?.message ||
      chrome.runtime?.lastError?.message ||
      fallback;

    return `${message}`.trim();
  };

  const applyLanguage = (lang) => {
    currentLang = resolveLanguage(lang);
    t = i18n[currentLang];
    html.lang = currentLang;

    document.title = t.appTitle;
    document.querySelector('.header h3').textContent = t.appTitle;
    document.querySelectorAll('.tab-text')[0].textContent = t.preset;
    document.querySelectorAll('.tab-text')[1].textContent = t.custom;
    document.querySelector('label[for="preset-select"]').textContent = t.selectResolution;
    document.querySelector('label[for="custom-width"]').textContent = t.width;
    document.querySelector('label[for="custom-height"]').textContent = t.height;
    document.querySelector('.custom-resolution-hint').textContent = t.customResolutionHint;
    document.querySelector('.setting-title').textContent = t.viewportTitle;
    document.querySelector('.setting-desc').textContent = t.viewportDesc;
    setButtonState(t.applyBtn, applyBtn.disabled);
    setCaptureButtonState(t.captureBtn, captureBtn.disabled);
  };

  const renderPresets = (config, savedState = null) => {
    presetSelect.innerHTML = '';

    config.presets.forEach((groupData) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = groupData.group[currentLang] || groupData.group.en;

      groupData.options.forEach((opt) => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label[currentLang] || opt.label.en;
        optgroup.appendChild(option);
      });

      presetSelect.appendChild(optgroup);
    });

    const presetValues = config.presets.flatMap((groupData) => (
      groupData.options.map((option) => option.value)
    ));
    const state = normalizeState(savedState, presetValues, config.defaultResolution);

    presetSelect.value = state.presetResolution;
    if (!presetSelect.value) {
      presetSelect.selectedIndex = 0;
    }

    customWidth.value = state.customWidth;
    customHeight.value = state.customHeight;
    viewportOnlyCheckbox.checked = savedState
      ? state.viewportOnly
      : Boolean(config.defaultViewportOnly);

    modeRadios.forEach((radio) => {
      radio.checked = radio.value === state.mode;
    });
    presetSection.classList.toggle('hidden', state.mode !== 'preset');
    customSection.classList.toggle('hidden', state.mode !== 'custom');
  };

  const loadConfig = () => {
    setButtonState(t.loadingConfig, true);
    setStatus(t.loadingConfig);

    fetch(chrome.runtime.getURL('config.json'))
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(rawConfig => {
        const { config, usedFallback } = normalizeConfig(rawConfig, SAFE_FALLBACK_CONFIG);
        applyLanguage(config.language);
        
        // 加载用户保存的状态
        loadUserState((savedState) => {
          renderPresets(config, savedState);
          
          isConfigLoaded = true;
          setButtonState(t.applyBtn, false);
          setCaptureButtonState(t.captureBtn, false);
          setStatus(usedFallback ? t.loadError : '');
        });
      })
      .catch(error => {
        console.error('Failed to load config.json:', error);
        applyLanguage(SAFE_FALLBACK_CONFIG.language);

        // 加载用户保存的状态（即使 config.json 加载失败）
        loadUserState((savedState) => {
          renderPresets(SAFE_FALLBACK_CONFIG, savedState);
          
          isConfigLoaded = true;
          setButtonState(t.applyBtn, false);
          setCaptureButtonState(t.captureBtn, false);
          setStatus(t.loadError, 'error');
        });
      });
  };

  applyLanguage(SAFE_FALLBACK_CONFIG.language);
  setButtonState(t.applyBtn, true);
  setCaptureButtonState(t.captureBtn, true);

  loadConfig();

  // 模式切换事件
  modeRadios.forEach((radio) => {
    radio.addEventListener('change', (event) => {
      if (event.target.value === 'preset') {
        presetSection.classList.remove('hidden');
        customSection.classList.add('hidden');
      } else {
        presetSection.classList.add('hidden');
        customSection.classList.remove('hidden');
      }

      if (isConfigLoaded) {
        setStatus('');
        saveCurrentState();
      }
    });
  });

  // 预置分辨率选择变化事件
  presetSelect.addEventListener('change', () => {
    if (isConfigLoaded) {
      saveCurrentState();
    }
  });

  // 自定义宽高输入变化事件
  customWidth.addEventListener('change', () => {
    if (isConfigLoaded) {
      saveCurrentState();
    }
  });

  customHeight.addEventListener('change', () => {
    if (isConfigLoaded) {
      saveCurrentState();
    }
  });

  const applyResolution = async () => {
    if (!isConfigLoaded) {
      return;
    }

    let targetDimensions;
    const currentMode = document.querySelector('input[name="mode"]:checked').value;

    if (currentMode === 'preset') {
      targetDimensions = parseResolution(presetSelect.value);
      if (!targetDimensions) {
        setStatus(t.invalidPreset, 'error');
        return;
      }
    } else {
      const customValue = `${customWidth.value}x${customHeight.value}`;
      targetDimensions = parseResolution(customValue);
      if (!targetDimensions) {
        setStatus(t.invalidInput, 'error');
        return;
      }
    }

    setButtonState(t.applying, true);
    setStatus(t.applying);

    try {
      const currentWindow = await chrome.windows.getCurrent();
      await resizeWindow({
        currentWindow,
        targetDimensions,
        viewportOnly: viewportOnlyCheckbox.checked,
        measureViewport: async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab?.id) {
            throw new Error('Missing active tab id');
          }

          const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => ({
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight
            })
          });

          return result?.result;
        },
        updateWindow: (windowId, size) => chrome.windows.update(windowId, size)
      });

      setStatus(t.applySuccess, 'success');

      // 保存用户状态
      saveCurrentState();
    } catch (error) {
      console.error('Resize failed:', error);

      const restrictedPageError =
        error?.message?.includes('Cannot access') ||
        error?.message?.includes('Missing host permission') ||
        error?.message?.includes('Frame with ID 0 was removed') ||
        error?.message?.includes('No tab with id');

      setStatus(restrictedPageError ? t.viewportError : t.resizeError, 'error');
    } finally {
      setButtonState(t.applyBtn, false);
    }
  };

  // Viewport 开关变化时，立即按切换后的模式重新应用分辨率
  viewportOnlyCheckbox.addEventListener('change', () => {
    if (isConfigLoaded) {
      saveCurrentState();
      applyResolution();
    }
  });

  applyBtn.addEventListener('click', applyResolution);

  captureBtn.addEventListener('click', async () => {
    if (!isConfigLoaded) {
      return;
    }

    setCaptureButtonState(t.capturing, true);
    setStatus(t.capturing);

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      await runCapture(
        async () => {
          try {
            return await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
          } catch (error) {
            const stepError = new Error(
              `${t.captureStepError}${getErrorMessage(error, t.captureError)}`
            );
            stepError.cause = error;
            throw stepError;
          }
        },
        async (dataUrl) => {
          try {
            await chrome.downloads.download({
              url: dataUrl,
              filename: `viewport-${timestamp}.png`,
              saveAs: true
            });
          } catch (error) {
            const stepError = new Error(
              `${t.saveStepError}${getErrorMessage(error, t.captureError)}`
            );
            stepError.cause = error;
            throw stepError;
          }
        }
      );

      setStatus(t.captureSuccess, 'success');
    } catch (error) {
      console.error('Capture failed:', error);
      setStatus(error?.message || t.captureError, 'error');
    } finally {
      setCaptureButtonState(t.captureBtn, false);
    }
  });
});
