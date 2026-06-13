import fs from 'fs';
import path from 'path';
import juice from 'juice';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 获取可用主题列表
 * @returns {Array<string>} 主题名称数组
 */
export function getAvailableThemes() {
  const themesDir = path.join(__dirname, '../themes');
  const files = fs.readdirSync(themesDir);
  return files
    .filter(file => file.endsWith('.css'))
    .map(file => file.replace('.css', ''));
}

/**
 * 加载主题 CSS 文件
 * @param {string} themeName - 主题名称
 * @returns {string} CSS 内容
 */
export function loadTheme(themeName) {
  const themesDir = path.join(__dirname, '../themes');
  const themePath = path.join(themesDir, `${themeName}.css`);

  // 检查主题文件是否存在
  if (!fs.existsSync(themePath)) {
    const available = getAvailableThemes();
    throw new Error(
      `Theme "${themeName}" not found.\nAvailable themes: ${available.join(', ')}`
    );
  }

  return fs.readFileSync(themePath, 'utf-8');
}

/**
 * 将 CSS 内联到 HTML 中
 * @param {string} html - HTML 内容
 * @param {string} css - CSS 内容
 * @returns {string} 内联样式后的 HTML
 */
export function inlineStyles(html, css) {
  // 使用 juice 将 CSS 内联
  const inlined = juice.inlineContent(html, css, {
    applyStyleTags: true,
    removeStyleTags: true,
    preserveMediaQueries: false,
    preserveFontFaces: false,
    preserveImportant: true,
    // 微信公众号兼容性设置
    xmlMode: false,
  });

  return inlined;
}

/**
 * 生成完整的 HTML 文档
 * @param {string} html - HTML 内容
 * @param {string} themeName - 主题名称
 * @returns {string} 完整的 HTML 文档
 */
export function generateStyledHTML(html, themeName = 'wechat-default') {
  // 加载主题
  const css = loadTheme(themeName);

  // 内联样式
  const styledHTML = inlineStyles(html, css);

  // 生成完整的 HTML 文档
  const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="obsidian-to-rich">
  <title>Markdown to Rich Text</title>
</head>
<body>
${styledHTML}
</body>
</html>`;

  return fullHTML;
}

/**
 * 用给定的 CSS 字符串（而非主题文件）生成完整 HTML 文档
 * @param {string} html - HTML 内容
 * @param {string} css - CSS 字符串
 * @returns {string} 完整的 HTML 文档
 */
export function generateStyledHTMLWithCSS(html, css) {
  const styledHTML = inlineStyles(html, css);
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="obsidian-to-rich">
  <title>Markdown to Rich Text</title>
</head>
<body>
${styledHTML}
</body>
</html>`;
}

/**
 * 用给定的 CSS 字符串生成内联 HTML 片段
 * @param {string} html - HTML 内容
 * @param {string} css - CSS 字符串
 * @returns {string} 内联样式的 HTML 片段
 */
export function generateInlineHTMLWithCSS(html, css) {
  return inlineStyles(html, css);
}

/**
 * 提取内联样式的 HTML 片段（不包含 DOCTYPE 和 html/body 标签）
 * 适合直接复制到富文本编辑器
 * @param {string} html - HTML 内容
 * @param {string} themeName - 主题名称
 * @returns {string} 内联样式的 HTML 片段
 */
export function generateInlineHTML(html, themeName = 'wechat-default') {
  // 加载主题
  const css = loadTheme(themeName);

  // 内联样式
  const styledHTML = inlineStyles(html, css);

  return styledHTML;
}

/**
 * 清理 HTML，移除不兼容的标签和属性
 * @param {string} html - HTML 内容
 * @returns {string} 清理后的 HTML
 */
export function sanitizeHTML(html) {
  // 微信公众号不支持的标签和属性
  let sanitized = html;

  // 移除 class 属性（因为已经内联了样式）
  sanitized = sanitized.replace(/\s*class="[^"]*"/g, '');

  // 移除 id 属性
  sanitized = sanitized.replace(/\s*id="[^"]*"/g, '');

  // 移除 data-* 属性
  sanitized = sanitized.replace(/\s*data-[^=]*="[^"]*"/g, '');

  return sanitized;
}
