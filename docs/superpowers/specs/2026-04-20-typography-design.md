---
title: 中文排版优化
date: 2026-04-20
status: approved
---

# 中文排版优化设计

## 背景

黄福军公族谱 HonKit 电子书面向老中青三代读者。现有 CSS 已具备良好的字体栈、行高、首行缩进和两端对齐，但桌面端正文字号偏小、行宽过宽、中文标点间距未经优化。本次在现有 `styles/custom.css` 末尾叠加约 20 行 CSS，不改动任何已有规则。

## 目标

- 桌面端正文字号提升至 17px，降低长辈阅读疲劳
- 限制正文行宽至约 50–55 字/行（800px），符合中文舒适阅读区间
- 通过 OpenType `chws` feature 改善相邻标点间距
- 链接下划线下移 0.2em，避免穿透汉字笔画

## 实现

### 1. 桌面端字号与行宽（`@media (min-width: 601px)`）

```css
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

- 移动端已有独立的 `font-size: 16px`，不受影响
- `max-width: 800px` 仅限制内容区，侧边栏布局不变

### 2. 标点挤压与链接下划线

```css
.markdown-section {
  font-feature-settings: "chws" 1, "kern" 1;
}

.markdown-section a {
  text-underline-offset: 0.2em;
}

.book.color-theme-2 .markdown-section a {
  text-underline-offset: 0.2em;
}
```

- `chws`（Contextual Half-width Spacing）：不支持的浏览器静默忽略，无副作用
- `kern`：字偶距调整，多数字体已默认开启，显式声明以防被覆盖

## 修改范围

- 唯一改动文件：`styles/custom.css`（追加约 20 行）

## 验收标准

- 桌面端（≥601px）正文字号为 17px
- 正文内容区居中，最大宽度 800px
- 相邻标点（如"，。"）间距视觉上更紧凑
- 链接下划线与汉字笔画不重叠
- 移动端（≤600px）表现与改动前一致
