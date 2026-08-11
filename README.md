# obsidian-to-rich

把 Obsidian Markdown 一键转换成可直接打开/复制的 HTML。

## 安装

```bash
npm install
```

## 一条命令转换

```bash
node index.js path/to/note.md
```

默认会在项目根目录的 `outputs/` 下生成同名 HTML（例如 `outputs/note.html`）。

## 默认转换规则

- 去掉 YAML frontmatter
- 去掉文档开头的一级标题（H1）
- 普通正文行之间自动补空行（code block 内不补）
- 支持 Obsidian 图片嵌入语法 `![[image.png]]`
- 默认从文档上一级的 `attachments/` 目录找图片并转成 base64

## 可选参数

```bash
Usage: obsidian-to-rich [options] [input]

Arguments:
  input                                输入的 Obsidian Markdown 文件路径

Options:
  -V, --version                        显示版本号
  -t, --theme <theme>                  主题名称 (默认: wechat-default)
  --template <file>                    用控制面板导出的 JSON 模板渲染
  -i, --inline-only                    只输出内联 HTML（无 DOCTYPE/html/body）
  -s, --sanitize                       清理 HTML 属性，增强兼容性
  -a, --attachments-dir <dir>          图片目录（默认: ../attachments）
  --keep-frontmatter                   保留 frontmatter
  --keep-title                         保留开头 H1 标题
  --no-paragraph-spacing               关闭正文自动补空行
  -l, --list-themes                    列出所有主题
  -h, --help                           显示帮助
```

## 示例

```bash
# 默认规则转换
node index.js ./vault/article.md

# attachments 目录不在文档上一级时
node index.js ./vault/article.md -a ./_assets
```

## 主题

```bash
node index.js themes
```

预置无衬线主题：`forest-sans`（林绿）、`midnight-indigo`（靛蓝）等。

## 自定义主题：控制面板 + JSON 模板

不想手写 CSS？用控制面板可视化调参，导出 JSON 当模板：

```bash
# 1. 为某篇文章生成控制面板（带实时预览）
node index.js panel ./vault/article.md
#    -> outputs/article-panel.html

# 2. 浏览器打开该文件，调字体/字号/行高/颜色/标题样式等，
#    满意后点「导出 JSON」得到 theme.json

# 3. 用模板渲染最终 HTML
node index.js ./vault/article.md --template theme.json
```

可调参数：无衬线字体（苹方 / 思源黑体 / system-ui / 雅黑）、正文字号、行高、
段间距、内边距、字间距、强调主色 / 深色 / 浅底 / 正文色 / 背景色、
二级标题样式、一级标题对齐、代码块明暗、分割线样式、图片圆角 / 阴影、链接下划线、两端对齐。

> 字体说明：微信公众号不能嵌入网络字体，最终落到读者设备的系统字体，
> 故只提供无衬线（黑体）选项 —— 这是各设备上最稳的一类。
