# 修订说明




本电子书使用 Markdown 格式书写，对照纸质族谱，通过手机相机识别文字功能复制内容，并借助 AI 进行文字校对。由于 Microsoft Word 的文字排版与网页文字排版存在一定差异，电子书更多是为了适配不同终端的阅读习惯。文字排版方面，参考了阮一峰的《[中文技术文档的写作规范](https://github.com/ruanyf/document-style-guide)》以及 LCTT 的《[中文排版指北](https://guide.rustt.org/translation-guide/composing.html)》，对字间距、标点符号等做了调整。碑文使用古文言文书写，包含通假字与生僻字，已添加注音注解，调整段落换行，并修改了族谱中的一些错别字。记录如下：
 
## 勘误表

1. P3，“二00八”，更正为“二〇〇八”；省略号由“······” 更正为 “……”，其他页面也相应同样调整。
2. P5，“有好的”，更正为“有好多”。
3. P6，“被楚天掉”，更正为“被楚灭掉”；“——” 与 “：” 混合使用，统一改为后者。
4. P47、P49，“象”，更正为“像”。
5. P13，落款时间应该靠右对齐。
6. P26，出现多次名字笔误，“黄源” 更正为 “黄岩”；“利绵” 更正为 “利锦”；“上真” 更正为 “士真”；第二个“金才” 更正为“金祥”；“利嵩”更正为“利崇”；“山策”更正为“山笑”。
7. P27，“利宁” 更正为 “利宇”。
8. P48，“教百万”更正为“数百万”。

## HonKit 电子书优化

1. 通过 book.json 设置 language: zh-hans， 显示简体中文的界面和插件界面。
2. 安装页脚插件 honkit-plugin-tbfed-pagefooter
3. improve mobile UX and performance baseline
4. optimize Chinese typography for readability
5. add floating back-to-top button for long pages
6. add image lightbox with pinch-zoom and use layout override for custom assets
7. improve mobile UX with safe area, sidebar backdrop, scroll lock, and swipe navigation
8. add floating TOC toggle button for mobile
9. fix: prevent Android pull-to-refresh on content scroll

CSS (styles/custom.css):

 - Add text-indent: 2em to .markdown-section p for Chinese paragraph indent
 - Reset text-indent: 0 for right-aligned attribution <p> elements
 - Add text-align: center to h1–h4
 - Refactor .heading-with-share: switch share button to position:absolute
      so heading text is truly centered
