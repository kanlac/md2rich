import fs from 'fs';
import path from 'path';

/**
 * 获取图片的 MIME 类型
 * @param {string} imagePath - 图片文件路径
 * @returns {string} MIME 类型
 */
function getImageMimeType(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  };
  return mimeTypes[ext] || 'image/png';
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * 将图片文件转换为 base64 数据 URI
 * @param {string} imagePath - 图片文件路径
 * @param {string} baseDir - 基础目录（用于解析相对路径）
 * @returns {string} base64 数据 URI
 */
function resolveImagePathCandidates(imagePath, baseDir, attachmentsDir = '../attachments') {
  const decodedPath = safeDecodeURIComponent(imagePath);

  if (path.isAbsolute(decodedPath)) {
    return [decodedPath];
  }

  const normalizedPath = decodedPath.replace(/^\.\//, '');
  const candidates = [path.join(baseDir, normalizedPath)];

  if (attachmentsDir) {
    if (!normalizedPath.startsWith(`${attachmentsDir}/`)) {
      candidates.push(path.join(baseDir, attachmentsDir, normalizedPath));
    }

    const baseName = path.basename(normalizedPath);
    candidates.push(path.join(baseDir, attachmentsDir, baseName));
  }

  return [...new Set(candidates)];
}

export function convertImageToBase64(imagePath, baseDir = process.cwd(), options = {}) {
  try {
    const { attachmentsDir = '../attachments' } = options;
    const candidates = resolveImagePathCandidates(imagePath, baseDir, attachmentsDir);
    const absolutePath = candidates.find(candidate => fs.existsSync(candidate));

    // 检查文件是否存在
    if (!absolutePath) {
      console.warn(`⚠️  Warning: Image file not found: ${imagePath}`);
      return imagePath; // 返回原始路径
    }

    // 读取图片文件
    const imageBuffer = fs.readFileSync(absolutePath);
    const base64Data = imageBuffer.toString('base64');
    const mimeType = getImageMimeType(absolutePath);

    // 生成 data URI
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.warn(`⚠️  Warning: Failed to convert image to base64: ${imagePath}`, error.message);
    return imagePath; // 返回原始路径
  }
}

/**
 * 检查是否为本地图片路径
 * @param {string} src - 图片路径
 * @returns {boolean}
 */
export function isLocalImage(src) {
  // 排除 http/https/data URL
  return !src.startsWith('http://') &&
         !src.startsWith('https://') &&
         !src.startsWith('data:');
}

/**
 * 处理 HTML 中的所有图片，将本地图片转换为 base64
 * @param {string} html - HTML 内容
 * @param {string} baseDir - 基础目录（Markdown 文件所在目录）
 * @returns {string} 处理后的 HTML
 */
export function processImagesInHTML(html, baseDir = process.cwd(), options = {}) {
  // 匹配所有 img 标签
  const imgRegex = /<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
  const { attachmentsDir = '../attachments' } = options;

  let processedCount = 0;

  const result = html.replace(imgRegex, (match, before, src, after) => {
    // 如果是本地图片，转换为 base64
    if (isLocalImage(src)) {
      const base64Src = convertImageToBase64(src, baseDir, { attachmentsDir });
      if (base64Src !== src) {
        processedCount++;
        console.log(`✓ Converted image to base64: ${src}`);
      }
      return `<img ${before}src="${base64Src}"${after}>`;
    }
    // 否则保持原样
    return match;
  });

  if (processedCount > 0) {
    console.log(`\n✨ Total images converted: ${processedCount}`);
  }

  return result;
}
