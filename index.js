#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { parseMarkdown } from './lib/parser.js';
import {
  generateStyledHTML,
  generateInlineHTML,
  getAvailableThemes,
  sanitizeHTML
} from './lib/styler.js';
import { processImagesInHTML } from './lib/image-processor.js';

const program = new Command();

// 读取 package.json
const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

program
  .name('md2rich')
  .description('Convert Markdown to rich-text HTML with theme support')
  .version(packageJson.version);

program
  .argument('<input>', 'Input Markdown file path')
  .option('-o, --output <file>', 'Output HTML file path (required)')
  .option('-t, --theme <theme>', 'Theme name (default: wechat-default)', 'wechat-default')
  .option('-i, --inline-only', 'Generate inline HTML only (no DOCTYPE/html/body tags)')
  .option('-s, --sanitize', 'Clean HTML for better platform compatibility')
  .option('-l, --list-themes', 'List all available themes')
  .action(async (input, options) => {
    try {
      // 列出可用主题
      if (options.listThemes) {
        const themes = getAvailableThemes();
        console.log(chalk.cyan('\nAvailable themes:'));
        themes.forEach(theme => {
          const marker = theme === options.theme ? chalk.green('✓') : ' ';
          console.log(`  ${marker} ${theme}`);
        });
        console.log('');
        return;
      }

      // 检查输入文件
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`Error: Input file not found: ${input}`));
        process.exit(1);
      }

      // 读取 Markdown 文件
      console.log(chalk.blue(`Reading ${input}...`));
      const markdown = fs.readFileSync(input, 'utf-8');

      // 解析 Markdown
      console.log(chalk.blue('Parsing Markdown...'));
      let html = parseMarkdown(markdown);

      // 处理图片：将本地图片转换为 base64
      console.log(chalk.blue('Processing images...'));
      const inputDir = path.dirname(path.resolve(input));
      html = processImagesInHTML(html, inputDir);

      // 应用主题和内联样式
      console.log(chalk.blue(`Applying theme: ${options.theme}...`));
      if (options.inlineOnly) {
        html = generateInlineHTML(html, options.theme);
      } else {
        html = generateStyledHTML(html, options.theme);
      }

      // 清理 HTML
      if (options.sanitize) {
        console.log(chalk.blue('Sanitizing HTML...'));
        html = sanitizeHTML(html);
      }

      // 输出到文件
      if (!options.output) {
        console.error(chalk.red('\n✗ Error: Output file path is required. Use -o option.'));
        console.log(chalk.gray('\nExample: node index.js input.md -o output.html'));
        process.exit(1);
      }

      // 处理输出路径：如果是目录，则在目录下创建文件
      let outputPath = options.output;
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).isDirectory()) {
        const inputBaseName = path.basename(input, path.extname(input));
        outputPath = path.join(outputPath, `${inputBaseName}.html`);
      }

      fs.writeFileSync(outputPath, html, 'utf-8');
      console.log(chalk.green(`✓ HTML saved to: ${outputPath}`));

      // 提示用户如何使用生成的文件
      console.log(chalk.cyan('\n📖 How to use:'));
      console.log(chalk.gray(`  1. Open ${outputPath} in your browser`));
      console.log(chalk.gray('  2. Select all content (Cmd+A / Ctrl+A)'));
      console.log(chalk.gray('  3. Copy (Cmd+C / Ctrl+C)'));
      console.log(chalk.gray('  4. Paste into WeChat Editor or other rich-text editors'))

      console.log(chalk.green('\n✨ Done!'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// 添加 themes 子命令
program
  .command('themes')
  .description('List all available themes')
  .action(() => {
    const themes = getAvailableThemes();
    console.log(chalk.cyan('\nAvailable themes:'));
    themes.forEach(theme => {
      console.log(`  • ${theme}`);
    });
    console.log(chalk.gray('\nUse with: md2rich input.md -t <theme-name>\n'));
  });

program.parse();
