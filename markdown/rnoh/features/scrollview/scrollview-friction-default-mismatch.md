# RNOH 问题 02：ScrollView 摩擦系数默认行为不一致

> **问题来源**：Codex 历史对话《摩擦系数变更》（`D:\rn72_0724`）。
> **适用范围**：鸿蒙 RN 0.72 / RNOH 0.72 ScrollView；高版本可能存在实现差异，请以对应分支源码为准。
> **引入变更**：[PR #2427](https://gitcode.com/CPF-RN/ohos_react_native/pull/2427)；**修复提交**：[PR #3170](https://gitcode.com/CPF-RN/ohos_react_native/pull/3170)，Commit `7d5a459c8`。
> **验证状态**：Harmony x86_64 目标单文件原生编译通过；模拟器/真机滚动体感及动态移除场景仍需运行时回归。

## 问题卡片

| 项目 | 内容 |
| --- | --- |
| 现象 | PR #2427 后，未设置 `decelerationRate` 时最终 ArkUI `friction` 从 `0.75` 变为约 `0.5` |
| 直接原因 | Harmony normal 已改为 `0.997`，但未设置属性仍携带 RN 社区默认值 `0.998` |
| 关键边界 | 业务显式传入数值 `0.998` 是合法新能力，不能把所有 `0.998` 都特判成 normal |
| 修复位置 | RNOH `ScrollViewRawProps::getFromDynamic`：缺失或 `null` 时补 Harmony 默认值 `0.997` |
| 修改范围 | 仅 `ScrollViewComponentInstance.h/.cpp`，不修改 RN 社区 `ScrollViewProps` |

## 最短结论

这不是浮点精度问题。`0.998` 与 Harmony normal `0.997` 本来就相差约 `0.001`，远大于 `0.00001` 的判定容差，因此一定会进入连续公式并得到约 `0.5`。

正确修复不是扩大 epsilon，也不是把 `0.998` 强行当成 normal，而是根据 raw props 区分“未设置/动态移除”和“显式数值”：前者补 `0.997`，后者保留用户输入。

本文档对应 RNOH 0.72 当前仓库，解决以下问题：

> PR #2427 为 ScrollView 增加数值型 `decelerationRate` 到 ArkUI `friction` 的连续映射后，`decelerationRate="normal"` 和 `"fast"` 的最终效果保持不变，但未设置 `decelerationRate` 时仍使用 RN 社区默认值 `0.998`，导致 ArkUI `friction` 从修改前的 `0.75` 变成约 `0.5`。同时，用户显式设置数值 `0.998` 时应继续使用新的连续映射，不能被当成默认值。

相关改动由 [PR #2427](https://gitcode.com/CPF-RN/ohos_react_native/pull/2427) 引入。

## 第一部分：当前方案 Patch

涉及文件：

- `tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.h`
- `tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp`

```diff
diff --git a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp
index 560d97849..5db267d46 100644
--- a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp
+++ b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp
@@ -189,7 +189,8 @@ void rnoh::ScrollViewComponentInstance::onPropsChanged(
   m_disableIntervalMomentum = props->disableIntervalMomentum;
   m_scrollToOverflowEnabled = props->scrollToOverflowEnabled;
   m_scrollNode.setHorizontal(isHorizontal(props))
-      .setFriction(getFrictionFromDecelerationRate(props->decelerationRate))
+      .setFriction(
+          getFrictionFromDecelerationRate(rawProps.decelerationRate))
       .setScrollBarDisplayMode(getScrollBarDisplayMode(
           isHorizontal(props),
           m_persistentScrollbar,
@@ -556,7 +557,6 @@ ScrollViewComponentInstance::getFrictionFromDecelerationRate(
     facebook::react::Float decelerationRate) {
   constexpr facebook::react::Float ARKUI_NORMAL = 0.75f;
   constexpr facebook::react::Float ARKUI_FAST = 2.0f;
-  constexpr facebook::react::Float HARMONY_NORMAL = 0.997f;
   constexpr facebook::react::Float HARMONY_FAST = 0.992f;
   constexpr facebook::react::Float kRateEpsilon = 0.00001f;
   constexpr facebook::react::Float kMinFriction = 0.1f;
@@ -567,7 +567,10 @@ ScrollViewComponentInstance::getFrictionFromDecelerationRate(
   }

   // Fast path for preset rates.
-  if (std::abs(decelerationRate - HARMONY_NORMAL) < kRateEpsilon) {
+  if (std::abs(
+          decelerationRate -
+          ScrollViewRawProps::HARMONY_NORMAL_DECELERATION_RATE) <
+      kRateEpsilon) {
     return ARKUI_NORMAL;
   }
   if (std::abs(decelerationRate - HARMONY_FAST) < kRateEpsilon) {
@@ -878,8 +881,20 @@ ScrollViewComponentInstance::ScrollViewRawProps::getFromDynamic(folly::dynamic v
   auto flingSpeedLimit = (value.count("flingSpeedLimit") > 0)
       ? std::optional<float>(value["flingSpeedLimit"].asDouble())
       : std::nullopt;
+  auto decelerationRate =
+      (value.count("decelerationRate") > 0 &&
+       !value["decelerationRate"].isNull())
+      ? static_cast<facebook::react::Float>(
+            value["decelerationRate"].asDouble())
+      : HARMONY_NORMAL_DECELERATION_RATE;

-  return {overScrollMode, nestedEnabled, endFillColor, fadingEdgeLength, flingSpeedLimit};
+  return {
+      overScrollMode,
+      nestedEnabled,
+      endFillColor,
+      fadingEdgeLength,
+      flingSpeedLimit,
+      decelerationRate};
 }

 facebook::react::Point ScrollViewComponentInstance::getContentViewOffset()
diff --git a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.h b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.h
index 68969e016..f482c148b 100644
--- a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.h
+++ b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.h
@@ -81,6 +81,10 @@ class ScrollViewComponentInstance
     std::optional<uint32_t> endFillColor;
     std::optional<float> fadingEdgeLength;
     std::optional<float> flingSpeedLimit;
+    static constexpr facebook::react::Float
+        HARMONY_NORMAL_DECELERATION_RATE = 0.997f;
+    facebook::react::Float decelerationRate{
+        HARMONY_NORMAL_DECELERATION_RATE};
     static ScrollViewRawProps getFromDynamic(folly::dynamic value);
   };
   ScrollViewRawProps m_rawProps;
```

改动仅位于鸿蒙 RNOH 的 `ScrollViewComponentInstance.h/.cpp`。RN 社区 `ScrollViewProps.h`、`ScrollViewProps.cpp`、JS 属性类型、ArkUI `ScrollNode` 和连续映射公式均保持原实现。

## 第二部分：问题原因

### 2.1 PR 前只有 normal 和 fast 两档效果

PR #2427 合入前，`getFrictionFromDecelerationRate` 使用二段映射：

```cpp
facebook::react::Float IOS_NORMAL = 0.998;
facebook::react::Float IOS_FAST = 0.99;
facebook::react::Float ARKUI_FAST = 2;
facebook::react::Float ARKUI_NORMAL = 0.75;

if (decelerationRate < (IOS_NORMAL + IOS_FAST) / 2) {
  return ARKUI_FAST;
} else {
  return ARKUI_NORMAL;
}
```

分界值为：

```text
(0.998 + 0.99) / 2 = 0.994
```

因此：

```text
decelerationRate < 0.994  → ArkUI friction = 2.0
decelerationRate ≥ 0.994  → ArkUI friction = 0.75
```

修改前的三个常用场景为：

| RN 使用方式 | 原生收到的 `decelerationRate` | ArkUI `friction` |
|---|---:|---:|
| `decelerationRate="normal"` | `0.998` | `0.75` |
| `decelerationRate="fast"` | `0.99` | `2.0` |
| 不设置 `decelerationRate` | RN 默认值 `0.998` | `0.75` |

### 2.2 PR 后字符串预设和数值映射同时发生变化

PR #2427 将 Harmony JS 侧的字符串预设改为：

```cpp
"normal" → 0.997
"fast"   → 0.992
```

原生侧则增加两个快速分支和连续公式：

```cpp
HARMONY_NORMAL = 0.997f;
HARMONY_FAST = 0.992f;

0.997 → ARKUI_NORMAL = 0.75
0.992 → ARKUI_FAST = 2.0
其他合法数值 → 250 × (1 - decelerationRate)
```

因此显式设置字符串时，修改前后的最终效果一致：

| RN 使用方式 | PR 前 `friction` | PR 后 `friction` |
|---|---:|---:|
| `"normal"` | `0.75` | `0.75` |
| `"fast"` | `2.0` | `2.0` |

### 2.3 未设置属性不会经过 Harmony JS 字符串转换

Harmony `ScrollView.harmony.js` 只在属性非空时调用 `processDecelerationRate`：

```js
const { decelerationRate } = this.props;
if (decelerationRate != null) {
  props.decelerationRate = processDecelerationRate(decelerationRate);
}
```

所以：

```text
decelerationRate="normal"
  → JS 转换为 0.997
  → 原生 normal 分支
  → friction = 0.75

未设置 decelerationRate
  → JS 不写入该属性
  → Fabric 使用 RN 社区默认值 0.998
```

RN 社区默认值位于：

```cpp
// ScrollViewProps.h
Float decelerationRate{0.998f};
```

该值在 PR 前会进入二段映射的 normal 档，得到 `0.75`；在 PR 后不再等于 Harmony normal 预设 `0.997`，于是进入连续公式：

```text
friction = 250 × (1 - 0.998)
         ≈ 0.5
```

所以 PR 后三个常用场景实际变为：

| RN 使用方式 | 有效 `decelerationRate` | PR 前 `friction` | PR 后当前 `friction` |
|---|---:|---:|---:|
| `"normal"` | `0.997` | `0.75` | `0.75` |
| `"fast"` | `0.992` | `2.0` | `2.0` |
| 不设置 | RN 默认值 `0.998` | `0.75` | 约 `0.5` |

### 2.4 不能根据数值 0.998 判断是否为默认场景

PR #2427 的一项目标是允许用户直接设置数值型 `decelerationRate`，由原生侧进行连续映射。

因此下面两种输入虽然最终都会让 Fabric Props 中的 `decelerationRate` 等于 `0.998`，语义却不同：

```text
场景一：用户没有设置属性
  → 0.998 来自 RN 社区默认值
  → 应与 Harmony "normal" 保持一致
  → 应使用 0.997 对应的 friction 0.75

场景二：用户显式设置 decelerationRate={0.998}
  → 0.998 是用户输入
  → 应保留新的连续映射能力
  → friction ≈ 0.5
```

如果直接在 `getFrictionFromDecelerationRate` 中将所有 `0.998` 特判为 normal，就会覆盖用户的显式数值，破坏 PR 新增的数值映射能力。

同理，仅把 RN 社区 `ScrollViewProps` 默认值改成 `0.997` 虽然可以改变默认结果，但会把 Harmony 平台特定策略写入 RN 社区代码，并且需要同步维护 `ScrollViewProps.h` 和 `ScrollViewProps.cpp` 中的多个默认入口。

### 2.5 rawProps 能区分未设置、显式设置和动态移除

RNOH Props 保存了 JS 原始属性 `rawProps`。其状态可以区分三个场景：

| 场景 | `rawProps.count("decelerationRate")` | `rawProps["decelerationRate"].isNull()` |
|---|---:|---:|
| 首次未设置 | `0` | 不读取 |
| 显式设置字符串或数值 | 大于 `0` | `false` |
| 设置后动态移除 | 大于 `0` | `true` |

动态移除需要额外检查 `isNull()`，因为 RNOH 的 `Props` 会合并前后两次 `rawProps`；属性移除后键可能仍然存在，但值会变成 `null`。

因此，`ScrollViewRawProps::getFromDynamic` 中需要同时判断键是否存在、值是否非 `null`：

```cpp
value.count("decelerationRate") > 0 &&
    !value["decelerationRate"].isNull()
```

### 2.6 最终根因

根因不是 `0.998` 与 `0.997` 的普通浮点误差，也不是 `"normal"` 和 `"fast"` 的预设映射错误。

更精确的结论是：

> PR #2427 已经把显式 `"normal"` 和 `"fast"` 转换成 Harmony 对应的 `0.997` 和 `0.992`，但未设置属性时不会经过 JS 转换，Fabric 仍提供 RN 社区默认值 `0.998`。新的原生映射无法仅根据最终数值判断 `0.998` 来自社区默认值还是用户显式输入，导致默认场景被误当成自定义数值并映射为约 `0.5`。

## 第三部分：当前方案如何解决此问题

### 3.1 在鸿蒙 ScrollView 组件实例层补齐默认语义

方案不修改 RN 社区默认值，而是在鸿蒙 `ScrollViewRawProps` 中定义 Harmony normal 默认值和解析后的有效值：

```cpp
static constexpr facebook::react::Float
    HARMONY_NORMAL_DECELERATION_RATE = 0.997f;
facebook::react::Float decelerationRate{
    HARMONY_NORMAL_DECELERATION_RATE};
```

`getFromDynamic` 负责解析默认语义：用户提供了有效属性就保留其数值；首次未设置或动态移除时使用 Harmony normal：

```cpp
auto decelerationRate =
    (value.count("decelerationRate") > 0 &&
     !value["decelerationRate"].isNull())
    ? static_cast<facebook::react::Float>(
          value["decelerationRate"].asDouble())
    : HARMONY_NORMAL_DECELERATION_RATE;
```

`onPropsChanged` 只消费解析后的有效值，并继续复用原有映射函数：

```cpp
auto rawProps = ScrollViewRawProps::getFromDynamic(props->rawProps);
// ...
setFriction(
    getFrictionFromDecelerationRate(rawProps.decelerationRate))
```

这种职责划分与当前 RNOH 的既有实现一致：

| 组件原始属性解析 | 属性未设置时的处理 | 含义 |
|---|---|---|
| `ImageRawProps::getFromDynamic` | `resizeMethod="auto"` | 在鸿蒙组件层补齐实际采用的默认策略 |
| `ViewRawProps::getFromDynamic` | `needsOffscreenAlphaCompositing=false` | 返回下游可以直接消费的有效值 |
| `ScrollViewRawProps::getFromDynamic` | `decelerationRate=0.997` | 补齐 Harmony normal，并保留显式数值 |

`overScrollMode`、`nestedScrollEnabled` 等字段未设置时返回 `nullopt`，是因为 `nullopt` 本身就表示“不覆盖 ArkUI 当前配置”；`decelerationRate` 不属于这种情况，`onPropsChanged` 每次都会调用 `setFriction`，因此这里需要返回一个确定的有效默认值。

Harmony 的 `ScrollView.harmony.js` 会先通过 `processDecelerationRate` 将 `"normal"`、`"fast"` 分别转换为数值 `0.997`、`0.992`，所以 `getFromDynamic` 对有效输入调用 `asDouble()` 与当前属性传递类型一致。

这使默认策略的所有权保持在鸿蒙适配层：

```text
RN 社区 Props
  → 继续保留社区默认值和上游代码

鸿蒙 RNOH ScrollViewComponentInstance
  → getFromDynamic 解析 rawProps
  → 未设置或值为 null 时补充 Harmony normal=0.997
  → 显式输入保持用户数值

原有连续映射函数
  → 处理解析后的有效值
  → 继续支持字符串预设和用户显式数值
```

### 3.2 显式数值不会被误判为默认值

修复后的关键行为如下：

```text
用户未设置
  → rawProps 中无有效 decelerationRate
  → effective rate = 0.997
  → friction = 0.75

用户显式设置 0.998
  → rawProps 中存在非 null 数值
  → effective rate = 0.998
  → friction = 250 × (1 - 0.998)
  → friction ≈ 0.5
```

因此该方案同时满足：

1. 恢复未设置属性时的原有 normal 效果；
2. 保留 PR 新增的数值型连续映射能力。

### 3.3 动态移除属性时恢复 Harmony 默认值

例如业务从：

```jsx
<ScrollView decelerationRate={0.995} />
```

动态切换为：

```jsx
<ScrollView />
```

RNOH 合并后的 `rawProps` 中可能仍存在 `decelerationRate` 键，但对应值为 `null`。当前方案通过 `isNull()` 将其识别为已移除：

```text
显式 0.995
  → getFromDynamic 保留显式值
  → friction ≈ 1.25

移除属性
  → rawProps value = null
  → getFromDynamic 使用 Harmony 默认值
  → effective rate = 0.997
  → friction = 0.75
```

如果只检查 `count()`，动态移除场景就可能被误判为仍有有效输入。

### 3.4 修改前后结果

| RN 使用方式 | 修复前有效值 | 修复前 `friction` | 修复后有效值 | 修复后 `friction` |
|---|---:|---:|---:|---:|
| 不设置 | 社区默认 `0.998` | 约 `0.5` | Harmony 默认 `0.997` | `0.75` |
| `"normal"` | `0.997` | `0.75` | `0.997` | `0.75` |
| `"fast"` | `0.992` | `2.0` | `0.992` | `2.0` |
| 显式 `0.998` | `0.998` | 约 `0.5` | `0.998` | 约 `0.5` |
| 显式 `0.995` | `0.995` | 约 `1.25` | `0.995` | 约 `1.25` |
| 设置后移除 | 社区默认 `0.998` | 约 `0.5` | Harmony 默认 `0.997` | `0.75` |

### 3.5 对原有行为和性能的影响

- **RN 社区代码**：`ScrollViewProps.h` 和 `ScrollViewProps.cpp` 均未修改，减少后续同步上游 RN 时的补丁维护。
- **字符串预设**：`"normal"` 和 `"fast"` 的 JS 转换及最终 `friction` 不变。
- **数值属性**：所有显式数值继续进入 PR #2427 的快速分支或连续公式。
- **默认行为**：首次不设置和动态移除属性都恢复为 Harmony normal，对齐 PR 前的最终 `friction=0.75`。
- **ArkUI 接口**：仍调用原有 `ScrollNode::setFriction`，未改变节点属性接口。
- **接口和 ABI**：没有修改公开 JS/C API、虚接口或函数签名；仅在 RNOH 内部嵌套的 `ScrollViewRawProps` 中增加一个 `Float` 字段，该结构随 RNOH 模块一起编译，不属于对外公开 ABI。
- **线程安全**：只读取当前不可变 Props，没有增加共享状态。
- **性能**：`getFromDynamic` 每次解析只增加一次属性键查询和一次 null 判断，没有新增分配、监听或遍历，影响可忽略。
- **修改范围**：只修改鸿蒙 ScrollView 组件实例的 `.h/.cpp` 两个文件，不影响其他 RN 平台和其他组件。

### 3.6 验证场景

建议至少验证以下场景：

1. 首次渲染时不设置 `decelerationRate`，确认最终使用 normal 滚动效果。
2. 设置 `decelerationRate="normal"`，确认最终效果与未设置一致。
3. 设置 `decelerationRate="fast"`，确认最终使用 fast 滚动效果。
4. 显式设置 `decelerationRate={0.998}`，确认仍走连续映射而不是 normal 特判。
5. 显式设置 `decelerationRate={0.995}`，确认最终 `friction` 约为 `1.25`。
6. 从自定义数值动态移除 `decelerationRate`，确认恢复 normal 效果。
7. 从 `"fast"` 动态移除 `decelerationRate`，确认恢复 normal 效果。

如需通过日志确认分支，可在本地验证版本临时记录：

```text
getFromDynamic 输入中是否存在 decelerationRate
getFromDynamic 输入值是否为 null
getFromDynamic 解析出的 decelerationRate
最终计算得到的 ArkUI friction
```

预期核心结果：

```text
未设置：
rawProps 中无有效输入
effectiveDecelerationRate=0.997
friction=0.75

显式设置 0.998：
rawProps 中存在非 null 数值
effectiveDecelerationRate=0.998
friction≈0.5
```

### 3.7 当前验证结果和边界

当前修改已经使用 Tester 工程现有的 x86_64 Harmony 原生构建图，对以下目标完成单文件编译：

```text
RNOHCorePackage/ComponentInstances/ScrollViewComponentInstance.cpp
```

编译成功，没有产生本次修改相关的错误或新增警告。

同时按当前源码的单精度计算验证了关键结果：

| 场景 | `getFromDynamic` 取值来源 | 有效值 | 计算结果 |
|---|---|---:|---:|
| 首次未设置 | Harmony 默认值 | `0.997` | `0.75` |
| `"normal"` | 显式属性值 | `0.997` | `0.75` |
| `"fast"` | 显式属性值 | `0.992` | `2.0` |
| 显式 `0.998` | 显式属性值 | `0.998` | 约 `0.499994` |
| 显式 `0.995` | 显式属性值 | `0.995` | 约 `1.249999` |
| 动态移除 | Harmony 默认值 | `0.997` | `0.75` |

以上结果证明源码可以编译，并且默认值选择与数值公式符合方案预期。滚动距离、速度衰减体感以及动态属性切换仍需在模拟器或真机上按 3.6 节场景完成运行时回归，单文件编译不能替代设备行为验证。
