document.addEventListener('DOMContentLoaded', async () => {
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const presetSection = document.getElementById('preset-section');
  const customSection = document.getElementById('custom-section');
  const presetSelect = document.getElementById('preset-select');
  const customWidth = document.getElementById('custom-width');
  const customHeight = document.getElementById('custom-height');
  const applyBtn = document.getElementById('apply-btn');
  const viewportOnlyCheckbox = document.getElementById('viewport-only');

  // 获取浏览器语言 (zh, ja, en 等)
  const getBrowserLang = () => {
    const lang = navigator.language || navigator.userLanguage;
    if (lang.startsWith('zh')) return 'zh';
    if (lang.startsWith('ja')) return 'ja';
    return 'en';
  };
  const currentLang = getBrowserLang();

  // i18n 翻译数据
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
      invalidInput: '请输入有效的宽度和高度（最小限制为 100px）。',
      viewportError: '无法访问当前页面进行精准计算，可能是因为当前页面是 Chrome 内部页面或被限制的页面。请在普通的网页上尝试。'
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
      invalidInput: '有効な幅と高さを入力してください（最小100px）。',
      viewportError: '現在のページにアクセスできないため、正確な計算ができません。Chrome内部ページや制限されたページの可能性があります。通常のウェブページでお試しください。'
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
      invalidInput: 'Please enter valid width and height (minimum 100px).',
      viewportError: 'Cannot access current page for precise calculation. This might be a Chrome internal page or restricted page. Please try on a regular webpage.'
    }
  };
  const t = i18n[currentLang];

  // 更新界面文本
  document.querySelectorAll('.tab-text')[0].textContent = t.preset;
  document.querySelectorAll('.tab-text')[1].textContent = t.custom;
  document.querySelector('label[for="preset-select"]').textContent = t.selectResolution;
  document.querySelector('label[for="custom-width"]').textContent = t.width;
  document.querySelector('label[for="custom-height"]').textContent = t.height;
  document.querySelector('.setting-title').textContent = t.viewportTitle;
  document.querySelector('.setting-desc').textContent = t.viewportDesc;
  applyBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 13L9 17L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    ${t.applyBtn}
  `;

  // 初始化加载配置文件
  try {
    const response = await fetch('config.json');
    const config = await response.json();

    // 动态渲染预置选项 (根据语言)
    config.presets.forEach(groupData => {
      const optgroup = document.createElement('optgroup');
      // 获取当前语言的组名
      const groupName = groupData.group[currentLang] || groupData.group.en;
      optgroup.label = groupName;
      
      groupData.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        // 获取当前语言的选项标签
        const labelText = opt.label[currentLang] || opt.label.en;
        option.textContent = labelText;
        optgroup.appendChild(option);
      });
      
      presetSelect.appendChild(optgroup);
    });

    // 设置默认选项
    if (config.defaultResolution) {
      presetSelect.value = config.defaultResolution;
    }
    
    // 设置默认 Viewport 开关状态
    if (config.defaultViewportOnly !== undefined) {
      viewportOnlyCheckbox.checked = config.defaultViewportOnly;
    }
  } catch (error) {
    console.error('Failed to load config.json:', error);
  }

  // 处理模式切换逻辑
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'preset') {
        presetSection.classList.remove('hidden');
        customSection.classList.add('hidden');
      } else {
        presetSection.classList.add('hidden');
        customSection.classList.remove('hidden');
      }
    });
  });

  // 处理"应用分辨率"点击逻辑
  applyBtn.addEventListener('click', async () => {
    let targetWidth, targetHeight;
    const currentMode = document.querySelector('input[name="mode"]:checked').value;

    if (currentMode === 'preset') {
      const dimensions = presetSelect.value.split('x');
      targetWidth = parseInt(dimensions[0], 10);
      targetHeight = parseInt(dimensions[1], 10);
    } else {
      targetWidth = parseInt(customWidth.value, 10);
      targetHeight = parseInt(customHeight.value, 10);

      // 验证输入
      if (!targetWidth || !targetHeight || targetWidth < 100 || targetHeight < 100) {
        alert(t.invalidInput);
        return;
      }
    }

    const isViewportOnly = viewportOnlyCheckbox.checked;

    if (isViewportOnly) {
      // 开启了仅针对可视区域（Viewport）调整
      try {
        // 获取当前活动的标签页
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // 注入脚本以获取当前页面的内部视口大小（排除系统边框的内部可用大小）
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight
            };
          }
        });

        const currentViewport = results[0].result;
        
        // 获取当前窗口的大小
        const currentWindow = await chrome.windows.getCurrent();
        
        // 计算浏览器边框和工具栏占用的额外空间 (Chrome UI Chrome)
        const widthDiff = currentWindow.width - currentViewport.innerWidth;
        const heightDiff = currentWindow.height - currentViewport.innerHeight;
        
        // 目标窗口大小 = 目标可视区域大小 + 浏览器额外空间
        const finalWindowWidth = targetWidth + widthDiff;
        const finalWindowHeight = targetHeight + heightDiff;

        await chrome.windows.update(currentWindow.id, {
          width: finalWindowWidth,
          height: finalWindowHeight
        });

      } catch (error) {
        console.error("Viewport calculation failed:", error);
        alert(t.viewportError);
      }
    } else {
      // 默认情况：调整整个浏览器窗口的大小
      chrome.windows.getCurrent((window) => {
        chrome.windows.update(window.id, {
          width: targetWidth,
          height: targetHeight
        });
      });
    }
  });
});