# Engineering Notes

工作实践、开发排查与技术学习总结。

## 查看方式

- GitHub Pages：推送到 `main` 后，由 Pages 工作流自动发布。
- 本地离线：克隆仓库后，直接用浏览器打开根目录的 `index.html`。

所有页面、样式、脚本和图表依赖均保存在仓库内，不依赖 CDN。

## 目录

```text
engineering-notes/
├── index.html
├── docs/
│   ├── rnoh/
│   │   ├── performance/
│   │   ├── features/
│   │   └── components/
│   │       └── scrollview/
│   └── cpp/
├── markdown/
│   ├── rnoh/
│   │   ├── performance/
│   │   ├── features/
│   │   └── components/
│   │       └── scrollview/
│   └── cpp/
├── skills/
│   └── README.md
└── AGENTS.md
```

`markdown/` 保存可编辑源文档，`docs/` 保存对应的 HTML 阅读版，`skills/` 保存可复用工作流。

## Markdown 与 HTML 双份机制

每份技术资料保留一份 Markdown 源文件和一份 HTML 阅读文件，二者使用相同的相对目录和文件名：

```text
markdown/rnoh/components/scrollview/触摸序列与点击滚动关系.md
docs/rnoh/components/scrollview/触摸序列与点击滚动关系.html
```

- 修改和审查：优先编辑 `markdown/` 中的 `.md`。
- 网页阅读：访问 `docs/` 中对应的 `.html`。
- 每次修改 Markdown 后，同步更新同路径、同文件名的 HTML。
- `node tools/check-site.mjs` 会检查两棵目录是否一一对应，并检查网页本地链接。

当前 ScrollView 专题包含：

1. RN 0.72 鸿蒙 ScrollView 完整控制流程
2. 触摸序列与点击、滚动的关系
3. `onPropsChanged` 属性更新调用链

## 站点检查

仓库提供无第三方依赖的链接检查脚本：

```text
node tools/check-site.mjs
```
