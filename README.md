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
├── skills/
│   └── README.md
└── AGENTS.md
```

`docs/` 保存可阅读文档，`skills/` 保存可复用工作流，二者分开维护。

当前 ScrollView 专题包含：

1. RN 0.72 鸿蒙 ScrollView 完整控制流程
2. 触摸序列与点击、滚动的关系
3. `onPropsChanged` 属性更新调用链

## 站点检查

仓库提供无第三方依赖的链接检查脚本：

```text
node tools/check-site.mjs
```
