#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import chalk from 'chalk';
import { parseMarkdown } from './lib/parser.js';
import {
  generateStyledHTML,
  generateInlineHTML,
  generateStyledHTMLWithCSS,
  generateInlineHTMLWithCSS,
  getAvailableThemes,
  sanitizeHTML
} from './lib/styler.js';
import { processImagesInHTML } from './lib/image-processor.js';
import { buildCSS } from './lib/theme-engine.js';
import { generatePanelHTML } from './lib/panel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, 'outputs');

const program = new Command();

// 读取 package.json
const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
);

program
  .name('obsidian-to-rich')
  .description('Convert Obsidian Markdown to rich-text HTML')
  .version(packageJson.version);

program
  .argument('[input]', 'Input Obsidian Markdown file path')
  .option('-t, --theme <theme>', 'Theme name (default: default)', 'default')
  .option('--template <file>', 'Render using a JSON theme template exported from the control panel')
  .option('-i, --inline-only', 'Generate inline HTML only (no DOCTYPE/html/body tags)')
  .option('-s, --sanitize', 'Clean HTML for better platform compatibility')
  .option('-a, --attachments-dir <dir>', 'Attachments directory relative to input file', 'attachments')
  .option('--keep-frontmatter', 'Keep YAML frontmatter in output')
  .option('--keep-title', 'Keep leading H1 title in output')
  .option('--no-paragraph-spacing', 'Do not insert extra blank lines between plain text lines')
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

      if (!input) {
        console.error(chalk.red('Error: Input file path is required.'));
        console.log(chalk.gray('\nExample: obsidian-to-rich article.md'));
        process.exit(1);
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
      let html = parseMarkdown(markdown, {
        stripFrontmatter: !options.keepFrontmatter,
        stripTitle: !options.keepTitle,
        paragraphSpacing: options.paragraphSpacing,
        attachmentsDir: options.attachmentsDir,
      });

      // 处理图片：将本地图片转换为 base64
      console.log(chalk.blue('Processing images...'));
      const inputDir = path.dirname(path.resolve(input));
      html = processImagesInHTML(html, inputDir, {
        attachmentsDir: options.attachmentsDir,
      });

      // 应用主题和内联样式
      if (options.template) {
        // 从控制面板导出的 JSON 模板生成 CSS
        if (!fs.existsSync(options.template)) {
          console.error(chalk.red(`Error: Template file not found: ${options.template}`));
          process.exit(1);
        }
        console.log(chalk.blue(`Applying template: ${options.template}...`));
        const params = JSON.parse(fs.readFileSync(options.template, 'utf-8'));
        const css = buildCSS(params);
        html = options.inlineOnly
          ? generateInlineHTMLWithCSS(html, css)
          : generateStyledHTMLWithCSS(html, css);
      } else {
        console.log(chalk.blue(`Applying theme: ${options.theme}...`));
        if (options.inlineOnly) {
          html = generateInlineHTML(html, options.theme);
        } else {
          html = generateStyledHTML(html, options.theme);
        }
      }

      // 清理 HTML
      if (options.sanitize) {
        console.log(chalk.blue('Sanitizing HTML...'));
        html = sanitizeHTML(html);
      }

      // 固定输出到项目根目录下的 output 文件夹
      const inputBaseName = path.basename(input, path.extname(input));
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, `${inputBaseName}.html`);

      fs.writeFileSync(outputPath, html, 'utf-8');
      console.log(chalk.green(`✓ HTML saved to: ${outputPath}`));

      // 提示用户如何使用生成的文件
      console.log(chalk.cyan('\n📖 How to use:'));
      console.log(chalk.gray(`  1. Open ${outputPath} in your browser`));
      console.log(chalk.gray('  2. Select all content (Cmd+A / Ctrl+A)'));
      console.log(chalk.gray('  3. Copy (Cmd+C / Ctrl+C)'));
      console.log(chalk.gray('  4. Paste into WeChat Editor or other rich-text editors'));

      console.log(chalk.green('\n✨ Done!'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// 生成主题控制面板
program
  .command('panel <input>')
  .description('Generate an interactive theme control panel for an article')
  .option('-a, --attachments-dir <dir>', 'Attachments directory relative to input file', 'attachments')
  .action(async (input, options) => {
    try {
      if (!fs.existsSync(input)) {
        console.error(chalk.red(`Error: Input file not found: ${input}`));
        process.exit(1);
      }
      console.log(chalk.blue(`Reading ${input}...`));
      const markdown = fs.readFileSync(input, 'utf-8');

      console.log(chalk.blue('Parsing Markdown...'));
      let body = parseMarkdown(markdown, {
        stripFrontmatter: true,
        stripTitle: false,
        paragraphSpacing: true,
        attachmentsDir: options.attachmentsDir,
      });

      console.log(chalk.blue('Processing images...'));
      const inputDir = path.dirname(path.resolve(input));
      body = processImagesInHTML(body, inputDir, { attachmentsDir: options.attachmentsDir });

      const title = path.basename(input, path.extname(input));
      const panelHTML = generatePanelHTML(body, title);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, `${title}-panel.html`);
      fs.writeFileSync(outputPath, panelHTML, 'utf-8');

      console.log(chalk.green(`✓ Control panel saved to: ${outputPath}`));
      console.log(chalk.cyan('\n📖 How to use:'));
      console.log(chalk.gray(`  1. Open ${outputPath} in your browser`));
      console.log(chalk.gray('  2. Tweak fonts / colors / spacing — preview updates live'));
      console.log(chalk.gray('  3. Click "导出 JSON" to download theme.json'));
      console.log(chalk.gray('  4. Render final HTML: node index.js article.md --template theme.json'));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
      if (error.stack) console.error(chalk.gray(error.stack));
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
    console.log(chalk.gray('\nUse with: obsidian-to-rich input.md -t <theme-name>\n'));
  });

program.parse();
