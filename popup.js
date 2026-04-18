const FALLBACK_CONFIG = {
  defaultResolution: '1440x900',
  defaultViewportOnly: false,
  presets: [
    {
      group: { zh: '常用', ja: 'よく使う', en: 'Common' },
      options: [
        { value: '1440x900', label: { zh: '1440 × 900 (MacBook 13")', ja: '1440 × 900 (MacBook 13")', en: '1440 × 900 (MacBook 13")' } },
        { value: '1920x1080', label: { zh: '1920 × 1080 (FHD)', ja: '1920 × 1080 (フルHD)', en: '1920 × 1080 (FHD)' } },
        { value: '1366x768', label: { zh: '1366 × 768 (HD)', ja: '1366 × 768 (HD)', en: '1366 × 768 (HD)' } },
        { value: '2560x1440', label: { zh: '2560 × 1440 (2K QHD)', ja: '2560 × 1440 (2K QHD)', en: '2560 × 1440 (2K QHD)' } },
        { value: '3840x2160', label: { zh: '3840 × 2160 (4K UHD)', ja: '3840 × 2160 (4K UHD)', en: '3840 × 2160 (4K UHD)' } }
      ]
    },
    {
      group: { zh: 'iPhone', ja: 'iPhone', en: 'iPhone' },
      options: [
        { value: '375x812', label: { zh: '375 × 812 (iPhone X/XS/11 Pro/12 mini/13 mini)', ja: '375 × 812 (iPhone X/XS/11 Pro/12 mini/13 mini)', en: '375 × 812 (iPhone X/XS/11 Pro/12 mini/13 mini)' } },
        { value: '390x844', label: { zh: '390 × 844 (iPhone 12/13/14/15)', ja: '390 × 844 (iPhone 12/13/14/15)', en: '390 × 844 (iPhone 12/13/14/15)' } },
        { value: '393x852', label: { zh: '393 × 852 (iPhone 15 Pro/16)', ja: '393 × 852 (iPhone 15 Pro/16)', en: '393 × 852 (iPhone 15 Pro/16)' } },
        { value: '414x896', label: { zh: '414 × 896 (iPhone XS Max/11 Pro Max)', ja: '414 × 896 (iPhone XS Max/11 Pro Max)', en: '414 × 896 (iPhone XS Max/11 Pro Max)' } },
        { value: '428x926', label: { zh: '428 × 926 (iPhone 12/13/14/15 Plus/Pro Max)', ja: '428 × 926 (iPhone 12/13/14/15 Plus/Pro Max)', en: '428 × 926 (iPhone 12/13/14/15 Plus/Pro Max)' } },
        { value: '430x932', label: { zh: '430 × 932 (iPhone 14/15 Pro Max)', ja: '430 × 932 (iPhone 14/15 Pro Max)', en: '430 × 932 (iPhone 14/15 Pro Max)' } }
      ]
    },
    {
      group: { zh: 'Android', ja: 'Android', en: 'Android' },
      options: [
        { value: '360x640', label: { zh: '360 × 640 (Android Small)', ja: '360 × 640 (Android Small)', en: '360 × 640 (Android Small)' } },
        { value: '360x740', label: { zh: '360 × 740 (Galaxy S8/S9/S10)', ja: '360 × 740 (Galaxy S8/S9/S10)', en: '360 × 740 (Galaxy S8/S9/S10)' } },
        { value: '360x780', label: { zh: '360 × 780 (Pixel 5)', ja: '360 × 780 (Pixel 5)', en: '360 × 780 (Pixel 5)' } },
        { value: '360x800', label: { zh: '360 × 800 (Galaxy S20/S21)', ja: '360 × 800 (Galaxy S20/S21)', en: '360 × 800 (Galaxy S20/S21)' } },
        { value: '384x854', label: { zh: '384 × 854 (Pixel 6/7)', ja: '384 × 854 (Pixel 6/7)', en: '384 × 854 (Pixel 6/7)' } },
        { value: '412x892', label: { zh: '412 × 892 (Pixel 8 Pro)', ja: '412 × 892 (Pixel 8 Pro)', en: '412 × 892 (Pixel 8 Pro)' } }
      ]
    },
    {
      group: { zh: '平板', ja: 'タブレット', en: 'Tablet' },
      options: [
        { value: '600x960', label: { zh: '600 × 960 (Nexus 7)', ja: '600 × 960 (Nexus 7)', en: '600 × 960 (Nexus 7)' } },
        { value: '768x1024', label: { zh: '768 × 1024 (iPad Mini/Air)', ja: '768 × 1024 (iPad Mini/Air)', en: '768 × 1024 (iPad Mini/Air)' } },
        { value: '810x1080', label: { zh: '810 × 1080 (iPad 10th)', ja: '810 × 1080 (iPad 第10世代)', en: '810 × 1080 (iPad 10th)' } },
        { value: '834x1112', label: { zh: '834 × 1112 (iPad Air 10.9")', ja: '834 × 1112 (iPad Air 10.9")', en: '834 × 1112 (iPad Air 10.9")' } },
        { value: '834x1194', label: { zh: '834 × 1194 (iPad Pro 11")', ja: '834 × 1194 (iPad Pro 11")', en: '834 × 1194 (iPad Pro 11")' } },
        { value: '1024x1366', label: { zh: '1024 × 1366 (iPad Pro 12.9")', ja: '1024 × 1366 (iPad Pro 12.9")', en: '1024 × 1366 (iPad Pro 12.9")' } }
      ]
    }
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const presetSection = document.getElementById('preset-section');
  const customSection = document.getElementById('custom-section');
  const presetSelect = document.getElementById('preset-select');
  const customWidth = document.getElementById('custom-width');
  const customHeight = document.getElementById('custom-height');
  const applyBtn = document.getElementById('apply-btn');
  const viewportOnlyCheckbox = document.getElementById('viewport-only');
  const statusMessage = document.getElementById('status-message');
  const html = document.documentElement;

  const getBrowserLang = () => {
    const lang = navigator.language || navigator.userLanguage || 'en';
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  };

  const currentLang = getBrowserLang();

  const i18n = {
    zh: {
      preset: '预置',
      custom: '自定义',
      selectResolution: '选择分辨率',
      width: '宽度 (px)',
      height: '高度 (px)',
      viewportTitle: '仅网页可视区域 (Viewport)',
      viewportDesc: '不包含工具栏、地址栏和书签栏',
      applyBtn: '应用分辨率',
      loadingConfig: '正在加载配置…',
      applying: '正在调整窗口大小…',
      applySuccess: '分辨率已应用。',
      invalidInput: '请输入有效的宽度和高度（最小限制为 100px）。',
      invalidPreset: '当前预置分辨率无效，请重新选择。',
      viewportError: '无法访问当前页面进行精准计算。请在普通网页中使用，Chrome 内部页面和扩展页不受支持。',
      resizeError: '调整窗口大小失败。请确认当前窗口不是最小化、全屏或受系统限制状态。',
      loadError: '配置文件不可用，已自动切换为内置安全预设。'
    },
    ja: {
      preset: 'プリセット',
      custom: 'カスタム',
      selectResolution: '解像度を選択',
      width: '幅 (px)',
      height: '高さ (px)',
      viewportTitle: 'ビューポートのみ',
      viewportDesc: 'ツールバー、アドレスバー、ブックマークバーを含まない',
      applyBtn: '解像度を適用',
      loadingConfig: '設定を読み込み中…',
      applying: 'ウィンドウサイズを調整中…',
      applySuccess: '解像度を適用しました。',
      invalidInput: '有効な幅と高さを入力してください（最小100px）。',
      invalidPreset: '現在のプリセット解像度が無効です。選び直してください。',
      viewportError: '現在のページにアクセスできないため、正確な計算ができません。通常のウェブページでお試しください。',
      resizeError: 'ウィンドウサイズの変更に失敗しました。最小化、全画面、またはOS制限の状態をご確認ください。',
      loadError: '設定ファイルを読み込めなかったため、内蔵の安全なプリセットに切り替えました。'
    },
    en: {
      preset: 'Preset',
      custom: 'Custom',
      selectResolution: 'Select Resolution',
      width: 'Width (px)',
      height: 'Height (px)',
      viewportTitle: 'Viewport Only',
      viewportDesc: 'Excludes toolbar, address bar, and bookmarks bar',
      applyBtn: 'Apply Resolution',
      loadingConfig: 'Loading configuration...',
      applying: 'Resizing browser window...',
      applySuccess: 'Resolution applied.',
      invalidInput: 'Please enter valid width and height (minimum 100px).',
      invalidPreset: 'The selected preset is invalid. Please choose another one.',
      viewportError: 'Cannot access the current page for precise calculation. Use this on a regular webpage, not on Chrome internal or extension pages.',
      resizeError: 'Failed to resize the browser window. Make sure the window is not minimized, fullscreen, or blocked by system restrictions.',
      loadError: 'The config file could not be loaded, so the extension switched to safe built-in presets.'
    }
  };

  const t = i18n[currentLang];
  let isConfigLoaded = false;

  const setButtonState = (label, disabled) => {
    applyBtn.disabled = disabled;
    applyBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${label}
    `;
  };

  const setStatus = (message, tone = '') => {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    if (tone) {
      statusMessage.classList.add(`is-${tone}`);
    }
  };

  const parseResolution = (value) => {
    if (typeof value !== 'string') return null;
    const match = value.match(/^(\d+)x(\d+)$/);
    if (!match) return null;

    const width = Number.parseInt(match[1], 10);
    const height = Number.parseInt(match[2], 10);

    if (width < 100 || height < 100) {
      return null;
    }

    return { width, height };
  };

  const renderPresets = (config) => {
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

    const defaultPreset = parseResolution(config.defaultResolution)
      ? config.defaultResolution
      : FALLBACK_CONFIG.defaultResolution;

    presetSelect.value = defaultPreset;
    if (!presetSelect.value) {
      presetSelect.selectedIndex = 0;
    }

    viewportOnlyCheckbox.checked = Boolean(config.defaultViewportOnly);
  };

  const loadConfig = async () => {
    setButtonState(t.loadingConfig, true);
    setStatus(t.loadingConfig);

    try {
      const response = await fetch(chrome.runtime.getURL('config.json'));
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const config = await response.json();
      renderPresets(config);
      isConfigLoaded = true;
      setButtonState(t.applyBtn, false);
      setStatus('');
    } catch (error) {
      console.error('Failed to load config.json:', error);
      renderPresets(FALLBACK_CONFIG);
      isConfigLoaded = true;
      setButtonState(t.applyBtn, false);
      setStatus(t.loadError, 'error');
    }
  };

  html.lang = currentLang;
  document.querySelectorAll('.tab-text')[0].textContent = t.preset;
  document.querySelectorAll('.tab-text')[1].textContent = t.custom;
  document.querySelector('label[for="preset-select"]').textContent = t.selectResolution;
  document.querySelector('label[for="custom-width"]').textContent = t.width;
  document.querySelector('label[for="custom-height"]').textContent = t.height;
  document.querySelector('.setting-title').textContent = t.viewportTitle;
  document.querySelector('.setting-desc').textContent = t.viewportDesc;
  setButtonState(t.applyBtn, true);

  await loadConfig();

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
      }
    });
  });

  applyBtn.addEventListener('click', async () => {
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
      const isViewportOnly = viewportOnlyCheckbox.checked;

      if (isViewportOnly) {
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

        const currentViewport = result?.result;
        if (!currentViewport?.innerWidth || !currentViewport?.innerHeight) {
          throw new Error('Viewport measurement failed');
        }

        const widthDiff = currentWindow.width - currentViewport.innerWidth;
        const heightDiff = currentWindow.height - currentViewport.innerHeight;

        await chrome.windows.update(currentWindow.id, {
          width: targetDimensions.width + widthDiff,
          height: targetDimensions.height + heightDiff
        });
      } else {
        await chrome.windows.update(currentWindow.id, {
          width: targetDimensions.width,
          height: targetDimensions.height
        });
      }

      setStatus(t.applySuccess, 'success');
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
  });
});
