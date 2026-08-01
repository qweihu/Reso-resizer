import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getViewportWindowSize,
  normalizeConfig,
  normalizeState,
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

test('normalizeState uses the configured default preset when no state exists', () => {
  assert.equal(
    normalizeState(null, ['1440x900', '1920x1080'], '1920x1080').presetResolution,
    '1920x1080'
  );
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
