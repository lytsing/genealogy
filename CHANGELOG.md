# 更新日志

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
