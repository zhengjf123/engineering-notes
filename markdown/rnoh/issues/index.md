# RNOH 问题

用于沉淀 RNOH 真实问题的复盘材料：现象、复现条件、根因链路、补丁方案和验证边界。Markdown 是可编辑源文档，网页阅读版位于 [docs/rnoh/issues/](../../../docs/rnoh/issues/index.html)。

## 问题列表

1. [Modal 路由切换后点击无响应](./modal-click-no-response.md)
   - [HTML 阅读版](../../../docs/rnoh/issues/modal-click-no-response.html)
   - 内容：A 页面 Modal 路由切换到 B 后仍可见但不可点击；根因是独立 Dialog 的 Modal 错误继承 A 页 `pointerEvents=none`；方案是修正 Modal Dialog 触摸根边界。
2. [ScrollView 摩擦系数默认行为不一致](./scrollview-friction-default-mismatch.md)
   - [HTML 阅读版](../../../docs/rnoh/issues/scrollview-friction-default-mismatch.html)
   - 内容：PR #2427 后未设置 `decelerationRate` 时错误采用 `0.998` 连续映射；修复在 RNOH raw props 层补 Harmony 默认值 `0.997`。

[返回 RNOH Markdown 目录](../index.md)
