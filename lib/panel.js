/*
 * panel.js — 生成「主题控制面板」HTML
 *
 * 把一篇文章正文 + 主题引擎源码 + 控制 UI 打包成单个 HTML：
 *   - 左侧面板调参（字体、字号、行高、颜色、间距、标题/代码/分割线样式…）
 *   - 右侧实时预览这篇文章
 *   - 顶部预设配色一键套用
 *   - 「导出 JSON」下载当前参数，喂给 CLI: node index.js x.md --template theme.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取引擎源码，去掉末尾 export，使其能在浏览器经典 <script> 里直接用
function loadEngineSource() {
  const src = fs.readFileSync(path.join(__dirname, 'theme-engine.js'), 'utf-8');
  return src.replace(/export\s*\{[^}]*\};?\s*$/m, '');
}

// 预设配色（只改颜色，其余参数沿用当前值）
// 取自 Tailwind CSS 专业调色板：accent=600 / accentDark=800 / tint=50，高饱和、亮、可读性已校准
const INK = '#1f2937';      // 统一正文色（Tailwind gray-800）
const PRESETS = [
  // —— 鲜艳系（Tailwind 600/800/50）——
  { id: 'red',     label: '朱红',   accent: '#dc2626', accentDark: '#991b1b', tint: '#fef2f2', textColor: INK, bgColor: '#ffffff' },
  { id: 'orange',  label: '橙',     accent: '#ea580c', accentDark: '#9a3412', tint: '#fff7ed', textColor: INK, bgColor: '#ffffff' },
  { id: 'amber',   label: '琥珀',   accent: '#d97706', accentDark: '#92400e', tint: '#fffbeb', textColor: INK, bgColor: '#ffffff' },
  { id: 'emerald', label: '翠绿',   accent: '#059669', accentDark: '#065f46', tint: '#ecfdf5', textColor: INK, bgColor: '#ffffff' },
  { id: 'teal',    label: '青',     accent: '#0d9488', accentDark: '#115e59', tint: '#f0fdfa', textColor: INK, bgColor: '#ffffff' },
  { id: 'cyan',    label: '天青',   accent: '#0891b2', accentDark: '#155e75', tint: '#ecfeff', textColor: INK, bgColor: '#ffffff' },
  { id: 'sky',     label: '天蓝',   accent: '#0284c7', accentDark: '#075985', tint: '#f0f9ff', textColor: INK, bgColor: '#ffffff' },
  { id: 'blue',    label: '宝蓝',   accent: '#2563eb', accentDark: '#1e40af', tint: '#eff6ff', textColor: INK, bgColor: '#ffffff' },
  { id: 'indigo',  label: '靛蓝',   accent: '#4f46e5', accentDark: '#3730a3', tint: '#eef2ff', textColor: INK, bgColor: '#ffffff' },
  { id: 'violet',  label: '紫罗兰', accent: '#7c3aed', accentDark: '#5b21b6', tint: '#f5f3ff', textColor: INK, bgColor: '#ffffff' },
  { id: 'fuchsia', label: '品红',   accent: '#c026d3', accentDark: '#86198f', tint: '#fdf4ff', textColor: INK, bgColor: '#ffffff' },
  { id: 'pink',    label: '桃红',   accent: '#db2777', accentDark: '#9d174d', tint: '#fdf2f8', textColor: INK, bgColor: '#ffffff' },
  { id: 'rose',    label: '玫红',   accent: '#e11d48', accentDark: '#9f1239', tint: '#fff1f2', textColor: INK, bgColor: '#ffffff' },
  // —— 中性 ——
  { id: 'graphite', label: '石墨',  accent: '#3f4756', accentDark: '#20242e', tint: '#eef0f3', textColor: INK, bgColor: '#ffffff' },
];

export function generatePanelHTML(bodyHTML, articleTitle = '预览文章') {
  const engineSource = loadEngineSource();
  const presetsJSON = JSON.stringify(PRESETS);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>主题控制面板 · ${articleTitle}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, "PingFang SC", "Segoe UI", sans-serif; background: #f4f5f7; color: #222; }
  .layout { display: flex; min-height: 100vh; }

  /* 左侧面板 */
  .panel { width: 340px; flex: 0 0 340px; background: #fff; border-right: 1px solid #e3e5e8; height: 100vh; overflow-y: auto; position: sticky; top: 0; padding: 18px 18px 60px; }
  .panel h1 { font-size: 16px; margin: 0 0 4px; }
  .panel .sub { font-size: 12px; color: #888; margin: 0 0 16px; line-height: 1.5; }
  .group { border-top: 1px solid #eee; padding: 14px 0 4px; }
  .group-title { font-size: 12px; font-weight: 700; color: #9098a3; letter-spacing: .5px; text-transform: uppercase; margin-bottom: 10px; }
  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 13px; color: #444; margin-bottom: 5px; display: flex; justify-content: space-between; }
  .field label .val { color: #2f7d5b; font-variant-numeric: tabular-nums; }
  .field input[type=range] { width: 100%; }
  .field select, .field input[type=text] { width: 100%; padding: 6px 8px; border: 1px solid #d4d7dc; border-radius: 6px; font-size: 13px; background: #fff; }
  .field.color { display: flex; align-items: center; gap: 8px; }
  .field.color label { flex: 1; margin: 0; }
  .field.color input[type=color] { width: 34px; height: 28px; padding: 0; border: 1px solid #d4d7dc; border-radius: 6px; background: #fff; cursor: pointer; }
  .field.color input[type=text] { width: 86px; flex: 0 0 86px; font-family: monospace; }
  .field.check { display: flex; align-items: center; gap: 8px; }
  .field.check label { margin: 0; }
  .presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px; }
  .preset { border: 1px solid #e0e2e6; border-radius: 20px; padding: 5px 12px; font-size: 12px; cursor: pointer; background: #fff; display: flex; align-items: center; gap: 6px; }
  .preset:hover { border-color: #bbb; }
  .dot { width: 12px; height: 12px; border-radius: 50%; }
  .actions { position: fixed; bottom: 0; left: 0; width: 340px; background: #fff; border-top: 1px solid #e3e5e8; padding: 12px 18px; display: flex; gap: 10px; }
  .btn { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; }
  .btn-primary { background: #2f7d5b; color: #fff; }
  .btn-ghost { background: #eef0f3; color: #333; }

  /* 右侧预览 */
  .preview-wrap { flex: 1; padding: 30px; display: flex; justify-content: center; align-items: flex-start; }
  /* 预览区是一张「页面」，正文按 maxWidth 居中其中，方便观察限宽效果 */
  #preview { width: 100%; max-width: 1000px; background: #eceef1; box-shadow: 0 4px 24px rgba(0,0,0,.08); border-radius: 10px; overflow: hidden; padding: 24px 0; }
  #preview .markdown-body { box-shadow: 0 1px 8px rgba(0,0,0,.06); border-radius: 8px; }
  #live-style {}
</style>
</head>
<body>
<div class="layout">
  <aside class="panel">
    <h1>🎨 主题控制面板</h1>
    <p class="sub">调好后点「导出 JSON」，把文件发给 Claude 即可作为模板。字体仅无衬线（黑体）选项。</p>

    <div class="group">
      <div class="group-title">预设配色</div>
      <div class="presets" id="presets"></div>
    </div>

    <div class="group">
      <div class="group-title">字体与排版</div>
      <div class="field" id="f-font"></div>
      <div class="field" id="f-fontSize"></div>
      <div class="field" id="f-lineHeight"></div>
      <div class="field" id="f-maxWidth"></div>
      <div class="field" id="f-paragraphSpacing"></div>
      <div class="field" id="f-padding"></div>
      <div class="field" id="f-letterSpacing"></div>
      <div class="field check" id="f-justify"></div>
    </div>

    <div class="group">
      <div class="group-title">颜色</div>
      <div class="field color" id="f-accent"></div>
      <div class="field color" id="f-accentDark"></div>
      <div class="field color" id="f-textColor"></div>
      <div class="field color" id="f-tint"></div>
      <div class="field color" id="f-bgColor"></div>
    </div>

    <div class="group">
      <div class="group-title">元素样式</div>
      <div class="field" id="f-headingStyle"></div>
      <div class="field" id="f-h1Align"></div>
      <div class="field" id="f-codeTheme"></div>
      <div class="field" id="f-hrStyle"></div>
      <div class="field" id="f-imgRadius"></div>
      <div class="field check" id="f-imgShadow"></div>
      <div class="field check" id="f-linkUnderline"></div>
    </div>
  </aside>

  <main class="preview-wrap">
    <div id="preview"><div class="markdown-body">${bodyHTML}</div></div>
  </main>
</div>

<div class="actions">
  <button class="btn btn-ghost" id="btn-reset">重置</button>
  <button class="btn btn-primary" id="btn-export">导出 JSON</button>
</div>

<style id="live-css"></style>

<script>
/* ===== 主题引擎（由 theme-engine.js 内联）===== */
${engineSource}

/* ===== 控制面板逻辑 ===== */
const PRESETS = ${presetsJSON};
let state = Object.assign({}, defaultParams);

// 把 buildCSS 产出的 CSS 全部限定到 #preview，避免污染面板本身
function scopeCSS(css, scope) {
  return css.replace(/(^|\\})\\s*([^{}]+)\\s*\\{/g, function (m, brace, sel) {
    const scoped = sel.split(',').map(function (s) { return scope + ' ' + s.trim(); }).join(', ');
    return brace + ' ' + scoped + ' {';
  });
}

function apply() {
  document.getElementById('live-css').textContent = scopeCSS(buildCSS(state), '#preview');
}

// 控件 schema
const fontOptions = Object.keys(FONT_STACKS).map(function (k) { return { value: k, label: FONT_LABELS[k] || k }; });
const RANGES = {
  fontSize: { min: 15, max: 22, step: 1, unit: 'px' },
  lineHeight: { min: 1.5, max: 2.2, step: 0.05, unit: '' },
  maxWidth: { min: 480, max: 960, step: 10, unit: 'px' },
  paragraphSpacing: { min: 8, max: 32, step: 1, unit: 'px' },
  padding: { min: 12, max: 44, step: 1, unit: 'px' },
  letterSpacing: { min: 0, max: 3, step: 0.5, unit: 'px' },
  imgRadius: { min: 0, max: 24, step: 1, unit: 'px' },
};
const SELECTS = {
  headingStyle: [['border-left','左侧竖条'],['underline','下划线'],['plain','无装饰']],
  h1Align: [['center','居中'],['left','左对齐']],
  codeTheme: [['dark','深色代码块'],['light','浅色代码块']],
  hrStyle: [['solid','实线'],['gradient','渐隐'],['dashed','虚线']],
};
const LABELS = {
  font: '字体', fontSize: '正文字号', lineHeight: '行高', maxWidth: '正文最大宽度', paragraphSpacing: '段间距',
  padding: '左右内边距', letterSpacing: '字间距', justify: '两端对齐',
  accent: '强调主色', accentDark: '强调深色', textColor: '正文色', tint: '强调浅底', bgColor: '背景色',
  headingStyle: '二级标题样式', h1Align: '一级标题对齐', codeTheme: '代码块', hrStyle: '分割线',
  imgRadius: '图片圆角', imgShadow: '图片阴影', linkUnderline: '链接下划线',
};

function rangeField(key) {
  const r = RANGES[key];
  const el = document.getElementById('f-' + key);
  el.innerHTML = '<label>' + LABELS[key] + '<span class="val">' + state[key] + r.unit + '</span></label>' +
    '<input type="range" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" value="' + state[key] + '">';
  const input = el.querySelector('input');
  const val = el.querySelector('.val');
  input.addEventListener('input', function () {
    state[key] = r.step < 1 ? parseFloat(input.value) : parseInt(input.value, 10);
    val.textContent = state[key] + r.unit;
    apply();
  });
}

function selectField(key, options) {
  const el = document.getElementById('f-' + key);
  const opts = options.map(function (o) {
    const v = Array.isArray(o) ? o[0] : o.value;
    const l = Array.isArray(o) ? o[1] : o.label;
    return '<option value="' + v + '"' + (state[key] === v ? ' selected' : '') + '>' + l + '</option>';
  }).join('');
  el.innerHTML = '<label>' + LABELS[key] + '</label><select>' + opts + '</select>';
  el.querySelector('select').addEventListener('change', function (e) { state[key] = e.target.value; apply(); });
}

function colorField(key) {
  const el = document.getElementById('f-' + key);
  el.innerHTML = '<input type="color" value="' + state[key] + '"><label>' + LABELS[key] + '</label><input type="text" value="' + state[key] + '">';
  const picker = el.querySelector('input[type=color]');
  const text = el.querySelector('input[type=text]');
  picker.addEventListener('input', function () { state[key] = picker.value; text.value = picker.value; apply(); });
  text.addEventListener('change', function () {
    if (/^#[0-9a-fA-F]{6}$/.test(text.value)) { state[key] = text.value; picker.value = text.value; apply(); }
  });
}

function checkField(key) {
  const el = document.getElementById('f-' + key);
  el.innerHTML = '<input type="checkbox" id="cb-' + key + '"' + (state[key] ? ' checked' : '') + '><label for="cb-' + key + '">' + LABELS[key] + '</label>';
  el.querySelector('input').addEventListener('change', function (e) { state[key] = e.target.checked; apply(); });
}

function renderControls() {
  selectField('font', fontOptions);
  ['fontSize','lineHeight','maxWidth','paragraphSpacing','padding','letterSpacing'].forEach(rangeField);
  checkField('justify');
  ['accent','accentDark','textColor','tint','bgColor'].forEach(colorField);
  Object.keys(SELECTS).forEach(function (k) { selectField(k, SELECTS[k]); });
  rangeField('imgRadius');
  checkField('imgShadow');
  checkField('linkUnderline');
}

function renderPresets() {
  const box = document.getElementById('presets');
  box.innerHTML = PRESETS.map(function (p) {
    return '<button class="preset" data-id="' + p.id + '"><span class="dot" style="background:' + p.accent + '"></span>' + p.label + '</button>';
  }).join('');
  box.querySelectorAll('.preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const p = PRESETS.find(function (x) { return x.id === btn.dataset.id; });
      ['accent','accentDark','tint','textColor','bgColor'].forEach(function (k) { if (p[k]) state[k] = p[k]; });
      renderControls(); apply();
    });
  });
}

document.getElementById('btn-reset').addEventListener('click', function () {
  state = Object.assign({}, defaultParams);
  renderControls(); apply();
});

document.getElementById('btn-export').addEventListener('click', function () {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'theme.json';
  a.click();
});

renderPresets();
renderControls();
apply();
</script>
</body>
</html>`;
}
