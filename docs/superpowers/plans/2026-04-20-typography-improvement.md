# 中文排版优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `styles/custom.css` 末尾追加约 20 行 CSS，改善桌面端字号、行宽及中文标点间距。

**Architecture:** 纯 CSS 叠加，不修改任何已有规则。桌面端（≥601px）字号提升至 17px、内容区限宽 800px；全局启用 OpenType `chws`/`kern`；链接下划线偏移 0.2em。

**Tech Stack:** CSS，HonKit（`npm run serve` 预览）

---

### Task 1: 追加桌面端字号与行宽规则

**Files:**
- Modify: `styles/custom.css`（文件末尾追加）

- [ ] **Step 1: 在 `styles/custom.css` 末尾追加以下内容**

```css
/* ===== Desktop typography ===== */
@media (min-width: 601px) {
  .markdown-section {
    font-size: 17px;
  }

  .page-inner {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
  }
}
```

- [ ] **Step 2: 启动开发服务器验证**

```bash
npm run serve
```

在浏览器打开 http://localhost:4000，展开任意正文页面：
- 桌面宽度（≥601px）下，正文字号应为 17px（DevTools → Elements → Computed → font-size）
- 正文内容区应居中，宽度不超过 800px
- 移动端模拟（≤600px）字号应仍为 16px，布局无变化

- [ ] **Step 3: 提交**

```bash
git add styles/custom.css
git commit -m "style: increase desktop font size to 17px and cap line width at 800px"
```

---

### Task 2: 追加 OpenType 标点挤压与链接下划线规则

**Files:**
- Modify: `styles/custom.css`（Task 1 内容之后继续追加）

- [ ] **Step 1: 在 `styles/custom.css` 末尾（Task 1 新增块之后）追加以下内容**

```css
/* ===== OpenType CJK punctuation & link underline ===== */
.markdown-section {
  font-feature-settings: "chws" 1, "kern" 1;
}

.markdown-section a,
.book.color-theme-2 .markdown-section a {
  text-underline-offset: 0.2em;
}
```

- [ ] **Step 2: 在浏览器验证**

服务器若已运行则刷新页面，否则执行 `npm run serve`：

1. 找到含有相邻标点的段落（如"，。"或"《》"），对比字符间距是否比改动前更紧凑（支持 `chws` 的浏览器：Chrome 94+、Safari 15.4+）
2. 悬停任意链接，确认下划线与汉字笔画之间有明显间隙（约 0.2em）
3. 切换夜间主题（HonKit 右上角 A 按钮），链接下划线偏移应同样生效

- [ ] **Step 3: 提交**

```bash
git add styles/custom.css
git commit -m "style: enable OpenType chws/kern and increase link underline offset"
```
