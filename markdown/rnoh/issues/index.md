# RNOH 问题

用于沉淀 RNOH 真实问题的复盘材料：现象、复现条件、根因链路、补丁方案和验证边界。Markdown 是可编辑源文档，网页阅读版位于 [docs/rnoh/issues/](../../../docs/rnoh/issues/index.html)。

## 问题列表

1. [Modal 路由切换后点击无响应](./modal-click-no-response.md)
   - [HTML 阅读版](../../../docs/rnoh/issues/modal-click-no-response.html)
   - 内容：A 页面 Modal 路由切换到 B 后仍可见但不可点击；根因是独立 Dialog 的 Modal 错误继承 A 页 `pointerEvents=none`；方案是修正 Modal Dialog 触摸根边界。

[返回 RNOH Markdown 目录](../index.md)
