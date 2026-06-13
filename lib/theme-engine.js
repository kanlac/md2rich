/*
 * theme-engine.js — 参数化主题引擎
 *
 * 输入一组参数 (params) -> 输出针对 .markdown-body 的完整 CSS 字符串。
 * 同一份逻辑在两处复用：
 *   - Node 端：CLI 用 --template x.json 渲染最终 HTML
 *   - 浏览器端：控制面板实时预览（panel 会把本文件源码内联进去）
 *
 * 注意：保持本文件「纯函数 + 无 import」，这样浏览器端能直接 strip 掉 export 使用。
 * 字体只提供无衬线（sans-serif）选项 —— 微信公众号最终落到读者系统字体，黑体最稳。
 */

// 无衬线字体族（key -> font-family 栈）
const FONT_STACKS = {
  pingfang: '"PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", "Noto Sans SC", "Segoe UI", sans-serif',
  'noto-sans': '"Noto Sans SC", "PingFang SC", -apple-system, BlinkMacSystemFont, "Microsoft YaHei", "Segoe UI", sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif',
  yahei: '"Microsoft YaHei", "PingFang SC", -apple-system, BlinkMacSystemFont, "Noto Sans SC", "Segoe UI", sans-serif',
};

const FONT_LABELS = {
  pingfang: '苹方 / 系统黑体（最通用）',
  'noto-sans': '思源黑体 Noto Sans SC',
  system: 'system-ui 系统默认',
  yahei: '微软雅黑 优先',
};

const MONO_STACK = '"SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", monospace';

// 默认参数（也是控制面板的初始值）
const defaultParams = {
  name: 'custom',
  font: 'pingfang',           // FONT_STACKS 的 key
  fontSize: 18,               // 正文字号 px
  lineHeight: 1.85,           // 正文行高
  paragraphSpacing: 18,       // 段间距 px
  maxWidth: 720,              // 正文最大宽度 px（居中，限宽更接近读文章体验）
  padding: 24,                // 容器左右内边距 px
  letterSpacing: 0,           // 正文字间距 px

  textColor: '#1f2522',       // 正文颜色
  bgColor: '#ffffff',         // 背景色
  accent: '#2f7d5b',          // 主题强调色
  accentDark: '#1f5a40',      // 强调深色（H1、加粗、strong）
  tint: '#e9f2ed',            // 强调浅底（引用/行内代码背景）

  headingStyle: 'border-left', // border-left | underline | plain
  h1Align: 'center',           // center | left
  codeTheme: 'dark',           // dark | light
  hrStyle: 'solid',            // solid | gradient | dashed
  justify: true,               // 段落两端对齐
  linkUnderline: true,         // 链接下划线
  imgRadius: 8,                // 图片圆角 px
  imgShadow: false,            // 图片阴影
};

// 把可能传入的部分参数补全为完整参数
function normalize(p) {
  return Object.assign({}, defaultParams, p || {});
}

// 标题装饰：根据 headingStyle 给 h2 生成不同样式
function headingDecoration(p) {
  if (p.headingStyle === 'underline') {
    return `padding-bottom: 8px; border-bottom: 2px solid ${p.accent};`;
  }
  if (p.headingStyle === 'plain') {
    return '';
  }
  // border-left（默认）
  return `padding-left: 12px; border-left: 5px solid ${p.accent};`;
}

function hrRule(p) {
  if (p.hrStyle === 'gradient') {
    return `border: none; width: 50%; height: 2px; background: linear-gradient(to right, transparent, ${p.accent}, transparent);`;
  }
  if (p.hrStyle === 'dashed') {
    return `border: none; border-top: 2px dashed ${p.accent}; width: 40%; height: 0; background: none;`;
  }
  return `border: none; width: 36%; height: 3px; border-radius: 3px; background: ${p.accent};`;
}

function codeBlock(p) {
  if (p.codeTheme === 'light') {
    return {
      preBg: p.tint,
      preBorder: `1px solid ${p.accent}33`,
      codeColor: p.textColor,
    };
  }
  return { preBg: '#1a1d22', preBorder: 'none', codeColor: '#dde3e0' };
}

/**
 * 主函数：参数 -> CSS 字符串
 */
function buildCSS(rawParams) {
  const p = normalize(rawParams);
  const font = FONT_STACKS[p.font] || FONT_STACKS.pingfang;
  const ta = p.justify ? 'justify' : 'left';
  const linkBorder = p.linkUnderline ? `border-bottom: 1px solid ${p.accent}66;` : '';
  const ls = p.letterSpacing ? `letter-spacing: ${p.letterSpacing}px;` : '';
  const cb = codeBlock(p);
  const imgShadow = p.imgShadow ? `box-shadow: 0 4px 16px ${p.accent}1f;` : '';

  return `
.markdown-body {
  font-family: ${font};
  font-size: ${p.fontSize}px;
  line-height: ${p.lineHeight};
  color: ${p.textColor};
  padding: ${Math.round(p.padding * 1.1)}px ${p.padding}px;
  max-width: ${p.maxWidth}px;
  margin: 0 auto;
  word-wrap: break-word;
  background: ${p.bgColor};
  ${ls}
}

h1 {
  font-size: ${Math.round(p.fontSize * 1.55)}px;
  font-weight: 800;
  color: ${p.accentDark};
  margin: ${p.paragraphSpacing * 2}px 0 ${p.paragraphSpacing}px;
  text-align: ${p.h1Align};
  line-height: 1.35;
}

h2 {
  font-size: ${Math.round(p.fontSize * 1.28)}px;
  font-weight: 700;
  color: ${p.accent};
  margin: ${Math.round(p.paragraphSpacing * 1.7)}px 0 ${p.paragraphSpacing}px;
  line-height: 1.4;
  ${headingDecoration(p)}
}

h3 {
  font-size: ${Math.round(p.fontSize * 1.12)}px;
  font-weight: 700;
  color: ${p.accent};
  margin: ${Math.round(p.paragraphSpacing * 1.4)}px 0 ${Math.round(p.paragraphSpacing * 0.8)}px;
  line-height: 1.4;
}

h4 {
  font-size: ${p.fontSize}px;
  font-weight: 700;
  color: ${p.accent};
  margin: ${p.paragraphSpacing}px 0 ${Math.round(p.paragraphSpacing * 0.6)}px;
  line-height: 1.4;
}

h5, h6 {
  font-size: ${Math.max(15, p.fontSize - 1)}px;
  font-weight: 700;
  color: ${p.textColor};
  margin: ${Math.round(p.paragraphSpacing * 0.9)}px 0 ${Math.round(p.paragraphSpacing * 0.5)}px;
  line-height: 1.4;
}

p {
  margin: ${p.paragraphSpacing}px 0;
  line-height: ${p.lineHeight};
  text-align: ${ta};
}

a {
  color: ${p.accent};
  text-decoration: none;
  ${linkBorder}
}

ul, ol {
  margin: ${p.paragraphSpacing}px 0;
  padding-left: 30px;
}

li {
  margin: ${Math.round(p.paragraphSpacing * 0.5)}px 0;
  line-height: ${p.lineHeight};
}

li p { margin: ${Math.round(p.paragraphSpacing * 0.35)}px 0; }

blockquote {
  margin: ${Math.round(p.paragraphSpacing * 1.3)}px 0;
  padding: 14px 22px;
  background: ${p.tint};
  border-left: 4px solid ${p.accent};
  color: ${p.textColor};
  font-size: ${Math.max(15, p.fontSize - 1)}px;
  border-radius: 0 6px 6px 0;
}

blockquote p { margin: 8px 0; }

code {
  padding: 2px 7px;
  margin: 0 2px;
  background: ${p.tint};
  border-radius: 4px;
  font-family: ${MONO_STACK};
  font-size: ${Math.max(13, p.fontSize - 3)}px;
  color: ${p.accentDark};
}

pre {
  margin: ${Math.round(p.paragraphSpacing * 1.3)}px 0;
  padding: 18px 20px;
  background: ${cb.preBg};
  border: ${cb.preBorder};
  border-radius: 8px;
  overflow-x: auto;
  line-height: 1.7;
}

pre code {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  color: ${cb.codeColor};
  font-size: ${Math.max(13, p.fontSize - 4)}px;
}

table {
  margin: ${Math.round(p.paragraphSpacing * 1.3)}px 0;
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  display: block;
  font-size: ${Math.max(14, p.fontSize - 2)}px;
}

thead { background: ${p.accent}; color: #ffffff; }

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 700;
  border: 1px solid ${p.accentDark};
}

td {
  padding: 11px 16px;
  border: 1px solid ${p.accent}33;
}

tbody tr:nth-child(even) { background: ${p.tint}66; }

hr {
  margin: ${p.paragraphSpacing * 2}px auto;
  ${hrRule(p)}
}

img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: ${Math.round(p.paragraphSpacing * 1.4)}px auto;
  border-radius: ${p.imgRadius}px;
  ${imgShadow}
}

strong { font-weight: 700; color: ${p.accentDark}; }
em { font-style: italic; color: ${p.textColor}; }
del { text-decoration: line-through; color: #9aa8a1; }
`.trim();
}

export { buildCSS, defaultParams, FONT_STACKS, FONT_LABELS, normalize };
