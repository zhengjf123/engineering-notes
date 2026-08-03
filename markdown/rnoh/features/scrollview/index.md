# ScrollView

RNOH ScrollView 的功能机制与问题案例。完整滚动控制流程、触摸序列和 Props 更新链仍位于[组件专题](../../components/scrollview/index.md)。

## 文档

1. [ScrollView 摩擦系数默认行为不一致](./scrollview-friction-default-mismatch.md)
   - [HTML 阅读版](../../../../docs/rnoh/features/scrollview/scrollview-friction-default-mismatch.html)
   - 未设置 `decelerationRate` 时需要保留 Harmony 默认值 `0.997`，不能将 React Native 的默认 `0.998` 当成显式数值连续映射。

[返回功能目录](../index.md) · [返回 RNOH Markdown 目录](../../index.md)
