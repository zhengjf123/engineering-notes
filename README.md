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
├── README.md
├── AGENTS.md
├── assets/
│   ├── site.js
│   └── styles.css
├── docs/
│   ├── index.html
│   ├── android/
│   │   ├── index.html
│   │   ├── react-native-android-trace.html
│   │   └── rn-android-environment-from-scratch.html
│   ├── rnoh/
│   │   ├── index.html
│   │   ├── performance/
│   │   │   └── rnoh-performance-issue-localization-guide.html
│   │   ├── features/
│   │   │   ├── index.html
│   │   │   ├── modal/
│   │   │   │   ├── index.html
│   │   │   │   └── modal-click-no-response.html
│   │   │   └── scrollview/
│   │   │       ├── index.html
│   │   │       └── scrollview-friction-default-mismatch.html
│   │   └── components/
│   │       ├── index.html
│   │       └── scrollview/
│   │           └── index.html
│   └── cpp/
├── markdown/
│   ├── index.md
│   ├── android/
│   │   ├── index.md
│   │   ├── react-native-android-trace.md
│   │   └── rn-android-environment-from-scratch.md
│   ├── rnoh/
│   │   ├── index.md
│   │   ├── performance/
│   │   │   └── rnoh-performance-issue-localization-guide.md
│   │   ├── features/
│   │   │   ├── index.md
│   │   │   ├── modal/
│   │   │   │   ├── index.md
│   │   │   │   └── modal-click-no-response.md
│   │   │   └── scrollview/
│   │   │       ├── index.md
│   │   │       └── scrollview-friction-default-mismatch.md
│   │   └── components/
│   │       ├── index.md
│   │       └── scrollview/
│   │           └── index.md
│   └── cpp/
├── skills/
└── tools/
````

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

当前 Android 专题包含：

1. React Native Android Trace 抓取与分析指南

当前 RNOH 性能专题包含：

1. RNOH 性能问题定位指导（基础篇）

当前 RNOH 功能目录包含：

1. Modal 路由切换后点击无响应
2. ScrollView 摩擦系数默认行为不一致

## 站点检查

仓库提供无第三方依赖的链接检查脚本：

```text
node tools/check-site.mjs
```
