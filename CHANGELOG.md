# 更新日志

## PDF 电子书专业排版优化

### 表格与排版

- **表格格式对齐** — 统一所有 Markdown 表格的列分隔符 `|` 垂直对齐，提高代码可维护性与 diff 可读性。
- **表格斑马纹** — PDF 表格奇偶行使用不同背景色，提升视觉可读性。
- **表格样式增强** — 优化表头背景色、边框、内边距，改进对比度。

### 字体与排版

- **相对字号单位** — 所有字号从固定像素改为相对 em 单位（h1: 1.8em, h2: 1.5em, h3: 1.2em, p: 1em），提高灵活性。
- **中文字体统一** — 统一 `book.json` 与 `styles/pdf.css` 的字体配置为 Noto Sans SC，避免冲突。
- **排版算法优化** — 启用 `text-rendering: optimizeLegibility` 与 `-webkit-text-size-adjust: 100%`，改进字体渲染质量。
- **行距精细调整** — 不同元素使用不同行距（正文 1.9, 标题 1.4, 列表 1.8, 表格 1.6），优化阅读舒适度。

### 版面设计

- **页脚装饰** — PDF 底部中央显示页码，使用浅色标记。
- **孤行孤段控制** — 添加 `orphans: 2` 与 `widows: 2`，防止段落首尾行孤立。
- **文本样式层级** — 统一标题色彩深度（h1: #222, h2: #333, h3: #444），增强视觉阶层。
- **两端对齐** — 正文与列表使用两端对齐，提升印刷感。
- **首行缩进** — 使用伪元素方式实现段落首行 2em 缩进（中文排版习惯）。

### 特殊元素样式

- **引用块** — 左边框 + 浅色背景，与代码块区分。
- **代码块** — 优化配色与左边框，等宽字体优先，改进 ASCII 图渲染。
- **强调文本** — 加粗文字深化，斜体文字浅化，链接色彩区分访问状态。
- **其他元素** — 完善 mark、del、ins 的样式处理。

### 自定义 PDF 构建管线（`npm run pdf`）

- **Puppeteer 替代 Calibre** (`scripts/build-pdf.js`) — HonKit 自带的
  `npx honkit pdf` 走 Calibre `ebook-convert`，在 Calibre 9.x 上生成的 PDF
  大纲会把所有章节都收缩到第 1 页（HonKit issue #117）。新流水线用
  Puppeteer (headless Chromium) 直接打印拼接后的章节 HTML，得到可点击且
  页码精准对应的书签。
- **可点击 PDF 大纲** — `page.pdf({ tagged: true, outline: true })` 让
  Chromium 从 `<h1>`/`<h2>`/`<h3>` 自动生成层级书签。
- **UTF-8 元数据回写** — 用 `pdf-lib` 二次写入
  Title/Author/Subject/Keywords/Creator/Producer，避免 Chromium 直出的
  中文 Title 乱码与空白 Author。元数据来源是 `book.json`。
- **CSS `@page` 驱动版面** — 关闭 puppeteer 的
  `displayHeaderFooter`，开 `preferCSSPageSize: true`，由 CSS `@page` 完全
  控制页边距、页眉、页码，便于按页类型（封面/目录/正文）分别配置。
- **空白页修复** — 提取章节 HTML 时清理 HonKit 序列化遗留的空 `<p></p>`、
  `<hr></hr>` 等隐形元素，避免独占一页。
- **`<br></br>` 双换行修复** — HonKit 把 `<br>` 序列化成 `<br></br>`，
  Chromium 重解析时把 `</br>` 当成另一个 `<br>` 导致诗歌出现双倍行距。
  构建侧用正则把连续 `<br>` 折叠回单个；Web 端配套 `scripts/fix-double-br.js`
  在 DOM 加载时做同样的清理。

### 封面、印刷版目录与图片

- **自定义封面页** — 替换 HonKit 默认的 `README.md` 渲染：放大扫描件 +
  副标题 + 电子版整理者 + 修订年份。`@page :first` / `@page cover` 隐藏
  封面页的所有页眉与页码。
- **印刷版目录（两遍渲染）** — 封面后插入 TOC 页（编号 + 标题 + 页码）。
  CSS `target-counter()` 在 Chromium headless 模式下不可用（实测失效），
  改用「两遍渲染」：第一遍渲染得到各章节真实页码（用 `pdf-lib` 读取自动
  生成的 outline 解析），第二遍把页码填入 TOC 重新渲染。
- **图片内联** — 把 markdown 中 `assets/images/page-XX.jpg` 的链接列表
  自动转为 `<figure>` + `<img>` + 图注，避免 PDF 里出现无法点击的死链。

### 章节页眉与镜像版面

- **Running header（章节名随页流动）** — 每章 `<article>` 通过
  `page: chN` 走独立命名页，配合 `@page chN { @top-* { content: "<title>" } }`
  让每页右上角自动显示当前章节名，方便翻阅。
- **奇偶页镜像页眉**（双面装订惯例）— `@page chN:left/:right` 把章节名
  固定在外侧角，`@page :left/:right` 把书名固定在内侧角。
- **目录页与封面页的特殊处理** — `@page :first` / `@page cover` 完全清空
  封面的页眉项；`@page toc` 隐藏 TOC 页的章节页眉但保留底部页码。
- **`string-set` 不可用的备忘** — 起初尝试 CSS GCPM 的 `string-set` +
  `string()` 实现 running header，被 Chromium headless 静默忽略，故改为
  上述「每章一个命名页」方案。

### CJK 行内排版（中文禁则）

- **`line-break: strict`** — 强制 CJK 行首行末禁则（`，。、` 不出现在行
  首；`「（` 不出现在行末）。
- **`text-spacing-trim: trim-start`** — 行首 CJK 开括号不再留半角空隙
  （Chrome 117+）。
- **`hanging-punctuation: allow-end last`** — 行末标点可悬挂到右边距（部
  分浏览器支持，不支持时静默 no-op）。

### 字号与链接细调

- **章节标题字号收敛** — H1 从 GitBook 默认的 ~24pt 调到 20pt（更接近传
  统中文书籍层级；Calibre 流水线的 ~16.5pt 作参照），H2 14pt，H3/H4
  12.5pt / 11.5pt 加粗。
- **链接配色去蓝** — 正文链接由原本的鲜亮蓝色 + 下划线，改为正文同色
  (#333) + 浅灰色细下划线，避免 PDF 上出现明显的「不可点击的蓝字」抢戏。
- **代码块字号精校** — 用 `pdfminer.six` 测量 Calibre 版的代码块实际字号
  作为参照（约 6.75pt），新流水线对齐到同尺寸，使谱图、宗枝图等
  ASCII 树状码块在 PDF 中宽度与可读性一致。

### 引用与标题排版

- **一级标题居中、二级及以下左对齐** (`styles/custom.css` /
  `styles/pdf.css`) — 强化层级感，章节标题居中，节内段落标题左对齐。
- **引用块首行不缩进** — 全局段落首行 2em 缩进规则不作用于
  `blockquote p`，让诗歌、自述、署名等不受牵连。
- **诗歌硬换行格式** (`HEAD.md`) — 七言绝句每句独立成行（行尾两空格触发
  Markdown 硬换行），节间加空行；解决了 Web 与 PDF 上长行被自动折断的问题。

## 移动端与阅读体验优化

### 内容修正

- **修复表格空单元格丢失问题** — Honkit 解析器会丢弃末尾的空表格单元格
  `| |`，导致数据行比表头少一列，显示出多余空列。将所有空单元格替换为
  `| &nbsp; |` 解决此问题。
- **`历代宗贤录` 页面** — 修正首行说明文字未闭合的 `<p>` 标签；各节表格按列宽对齐排版，便于维护与 diff 阅读。
- **诗歌排版** — 使用 `<pre>` 标签保留诗歌原始换行与缩进格式。
- **Markdown 格式统一** — 统一各章节标题层级、缩进风格，修正行尾双空格换行写法。
- **错别字校对** — 使用 AI 辅助校对全文错别字。

### 阅读进度与导航

- **阅读进度条** (`reading-progress.js`)
  — 页面顶部固定显示阅读进度，随滚动实时更新。
- **返回顶部按钮** (`back-to-top.js`)
  — 滚动超过一屏后显示浮动按钮，点击平滑回到顶部。移动端位于底部导航栏上方，避免遮挡。
- **滚动位置记忆** (`scroll-memory.js`)
  — 离开页面再返回时，自动恢复上次阅读位置。
- **左右滑动翻页** (`swipe-navigation.js`)
  — 支持手势左右滑动切换章节，滑动距离超过阈值才触发，避免误操作。

### 目录与侧栏

- **目录入口** — 小屏幕下通过 Honkit 主题自带的侧栏切换（工具栏 `fa-align-justify`）展开/收起目录。曾额外实现灰色浮动 TOC 按钮（`toc-toggle.js`），与主题按钮重复，已移除；避免与壳内红色菜单按钮叠放两套控件。

### 图片

- **图片灯箱** (`image-lightbox.js`)
  — 点击族谱图片全屏放大，支持双指捏合缩放、双击还原、键盘 Esc 关闭，iOS/Android 长按菜单已屏蔽。
- **纸质影像链接**（`shang-shi-zu-fen-zhi-tu.md`）
  — Honkit 主题会把正文区 `.page-inner a` 当作章节链接用 AJAX 打开；指向 `.jpg` 等非 HTML
  时点击会无反应。纸质扫描图链接改为带 `target="_blank"` 的 HTML `<a>`，在新标签页正常打开图片。
- **图片懒加载** (`image-performance.js`) — 使用 `IntersectionObserver`
  延迟加载视口外图片，减少首屏流量。
- **图片防溢出** (`custom.css`) — `max-width: 100%` 确保图片不超出内容区宽度。

### 表格

- **横向滚动提示** (`table-scroll-hints.js`)
  — 宽表格在小屏幕上可横向滚动；左右边缘用阴影动态提示还有内容未显示，滚动到头时阴影消失。

### 标题分享

- **标题锚点分享** (`share-links.js`)
  — 鼠标悬停标题时出现"分享"按钮，点击将带锚点的 URL 复制到剪贴板，并有短暂高亮反馈。

### 中文字体与排版

- **CJK 优先字体栈** (`custom.css`) — 将 PingFang SC、HarmonyOS Sans
  SC、微软雅黑等 CJK 字体置于 `system-ui` 之前，确保中文弯引号 `""`
  由中文字体渲染，避免显示为西文引号样式。
- **代码块与横向 ASCII 树图** (`custom.css`)
  — `pre` / `pre > code` 使用 `white-space: pre`、取消继承的 `letter-spacing`，并优先等宽字体（含常见
  CJK 等宽字体名），减轻 Android / Windows 上箱线字符与中文混排错位。
- **正文可读性**
  — 行高 1.9、字间距 0.01em、两端对齐、段首缩进 2em；标题居中、右对齐落款不缩进。
- **移动端字号响应** — 600px 以下正文 16px，360px 以下 15px；标题字号同步缩小。

### 移动端细节

- **安全区适配** — `viewport-fit=cover` +
  `safe-area-inset-*`，适配 iPhone 刘海屏与底部 Home 条。
- **触摸体验** — 移除
  `-webkit-tap-highlight-color`，防止 Android 下拉刷新干扰内容滚动（`overscroll-behavior-y: contain`）。
- **减少动效** — `@media (prefers-reduced-motion: reduce)`
  关闭所有过渡动画，照顾前庭敏感用户。
- **导航箭头优化** — 移动端导航箭头字号 36px、最小高度 50px，增大点击区域。

### 基础设施

- **HonKit 项目配置** (`book.json`)
  — 书名、描述、作者；`language` 设为 `zh-hans`，生成页面 `<html lang="…">`，便于浏览器按简体中文做语言与字体相关处理。
- **插件列表** — 在 `plugins` 中启用 `katex`、`tbfed-pagefooter`、`hints`；各插件参数见 `pluginsConfig`（如 KaTeX 样式地址、页脚版权与修订时间格式等）。
- **提示块插件** (`gitbook-plugin-hints` / Honkit 对应包名 `hints`)
  — 正文中可使用 `{% hint style='info' | 'tip' | 'danger' | 'working' %} … {% endhint %}`
  渲染带样式的提示框（如族谱页横向滚动说明、字词注释等），无需手写复杂 HTML。
- **自定义布局加载** (`_layouts/website/page.html`)
  — 通过 Honkit 布局覆盖注入自定义 CSS 与 JS，`serve` 和 `build`
  均生效，无需构建后手动注入。
- **静态资源缓存刷新** (`_layouts/website/page.html`)
  — 为 `styles/custom.css` 与自定义脚本 URL 追加 `?v=…`，版本号由构建时的 `gitbook.time`
  经清洗后自动生成，每次 `npm run build` 变更，便于 iOS/Android WebView 与浏览器拉取最新前端资源。
- **页脚插件** — `honkit-plugin-tbfed-pagefooter` 显示版权信息与文章修订时间。
- **数学公式** — `honkit-plugin-katex`
  支持 KaTeX 公式渲染（备用，族谱内容暂未使用）。
