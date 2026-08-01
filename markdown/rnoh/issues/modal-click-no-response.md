# RNOH 问题 01：Modal 路由切换后点击无响应

> **问题来源**：Codex 历史对话《modal点击无响应》（`D:\rn72_0724`）。
> **适用范围**：鸿蒙 RN 0.72 / RNOH 0.72 当前分支；高版本可能存在实现差异，请以对应分支源码为准。
> **问题状态**：已定位根因，并形成 RNOH 原生侧 Patch；应用侧路由卸载 Hook 仅作为临时绕过方案。

本文将问题现象、复现路径、根因、当前 Patch 以及验证边界集中整理，便于后续按“现象 → 触摸链路 → 源码位置 → 修复方案”检索。

## 问题卡片

| 项目 | 内容 |
| --- | --- |
| 现象 | A 页面保持 `visible=true` 的 Modal，跳转 B 页面后仍可见，但内部按钮点击无响应 |
| 平台差异 | Android 同条件下可点击；鸿蒙 RNOH 0.72 点击事件无法送达 JS |
| 典型组件 | `FuzzyConsignmentDialog`、`DotDialog`、`CheckProductMsgDialog` |
| 业务影响 | 弹窗覆盖新页面且无法操作，可能阻断收件流程 |
| 关键边界 | Modal 已在独立 ArkUI Dialog 中显示，但 C++ 逻辑父链仍挂在 A 页面 |

## 最短结论

鸿蒙 Modal 的独立 Dialog 已经收到触摸，但 `ModalHostViewComponentInstance` 复用了普通页面组件的父链触摸判断，错误继承 A 页的 `pointerEvents="none"`。因此触摸在 Modal 根节点被判定为不可命中，根本没有继续遍历到内部 `Pressable`。

修复的核心不是强制 Modal 随路由隐藏，而是让独立 Dialog 中的 Modal 以自身 `pointerEvents` 作为触摸边界；页面树中的 `m_virtualNode` 仍保留原有祖先感知的拦截行为。

本文档对应 RNOH 0.72 当前仓库，解决以下问题：

> A 页面创建并保持 `visible=true` 的 RN `Modal`，快速跳转到 B 页面后，Modal 仍覆盖在 B 页面上，但 Modal 内按钮点击事件无法送达 JS。Android 在相同条件下可以正常点击。

## 第一部分：当前方案 Patch

涉及文件：

- `tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.h`
- `tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.cpp`

```diff
diff --git a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.cpp b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.cpp
index 45dfcddeb..5c0c5c20a 100644
--- a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.cpp
+++ b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.cpp
@@ -205,6 +205,35 @@ void ModalHostViewComponentInstance::onChildRemoved(
   m_rootCustomNode.removeChild(childComponentInstance->getLocalRootArkUINode());
 };

+// Modal content is dispatched from an independent ArkUI dialog, so its touch
+// root must not inherit pointerEvents from the page behind the dialog.
+bool ModalHostViewComponentInstance::canHandleTouch() const {
+  return m_props == nullptr ||
+      m_props->pointerEvents == facebook::react::PointerEventsMode::Auto ||
+      m_props->pointerEvents == facebook::react::PointerEventsMode::BoxOnly;
+}
+
+bool ModalHostViewComponentInstance::canChildrenHandleTouch() const {
+  return m_props == nullptr ||
+      m_props->pointerEvents == facebook::react::PointerEventsMode::Auto ||
+      m_props->pointerEvents == facebook::react::PointerEventsMode::BoxNone;
+}
+
+void ModalHostViewComponentInstance::onArkUINodeTouchIntercept(
+    const ArkUI_UIInputEvent* event) {
+  // m_virtualNode stays in the page's ArkUI tree. Preserve its original,
+  // ancestor-aware intercept behavior; only the dialog is a new touch root.
+  auto parent = getParent().lock();
+  if (parent && !parent->canChildrenHandleTouch()) {
+    auto mode = IsAtLeastApi20()
+        ? HitTestMode::HTM_BLOCK_DESCENDANTS
+        : HitTestMode::HTM_NONE;
+    OH_ArkUI_PointerEvent_SetInterceptHitTestMode(event, mode);
+    return;
+  }
+  CppComponentInstance::onArkUINodeTouchIntercept(event);
+}
+
 void ModalHostViewComponentInstance::onFinalizeUpdates() {
   // only show modal after the screen size has been set and processed by RN
   auto isScreenSizeSet = m_state && m_state->getData().screenSize.height != 0 &&
diff --git a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.h b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.h
index ef007aaf4..f448a9359 100644
--- a/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.h
+++ b/tester/harmony/react_native_openharmony/src/main/cpp/RNOHCorePackage/ComponentInstances/ModalHostViewComponentInstance.h
@@ -60,6 +60,9 @@ class ModalHostViewComponentInstance
   void onChildRemoved(
       ComponentInstance::Shared const& childComponentInstance) override;

+  bool canHandleTouch() const override;
+  bool canChildrenHandleTouch() const override;
+
   void onFinalizeUpdates() override;

   void showDialog();
@@ -73,6 +76,10 @@ class ModalHostViewComponentInstance
   // ArkTSMessageHub::Observer
   void onMessageReceived(ArkTSMessage const& message) override;

+ protected:
+  void onArkUINodeTouchIntercept(
+      const ArkUI_UIInputEvent* event) override;
+
   friend class ModalHostTouchHandler;
 };
-} // namespace rnoh
\ No newline at end of file
+} // namespace rnoh
```

改动仅位于 Modal 组件实例。公共 `CppComponentInstance`、`TouchEventDispatcher`、Dialog 生命周期和事件监听流程均保持原实现。

## 第二部分：问题原因

### 2.1 Modal 在鸿蒙端存在两套父子关系

`ModalHostViewComponentInstance` 同时存在两种关系：

1. **React/C++ 逻辑树关系**

   Modal 仍然是 A 页面组件树中的后代，`m_parent` 指向 A 页面内的 View。

2. **ArkUI 实际显示和输入关系**

   Modal 内容没有显示在 A 页普通节点中，而是被插入 `m_rootCustomNode`，再由独立 `ArkUIDialogHandler` 显示：

   ```cpp
   m_rootCustomNode.insertChild(
       childComponentInstance->getLocalRootArkUINode(), index);

   m_dialogHandler.setContent(m_rootStackNode);
   m_dialogHandler.show();
   ```

   `ModalHostTouchHandler` 直接监听 `m_rootCustomNode`，收到 ArkUI 触摸后，以 Modal 自身作为 `TouchEventDispatcher` 的根节点：

   ```cpp
   ModalHostTouchHandler(ModalHostViewComponentInstance* rootView)
       : UIInputEventHandler(rootView->m_rootCustomNode), m_rootView(rootView) {}

   void onTouchEvent(ArkUI_UIInputEvent* event) override {
     m_touchEventDispatcher.dispatchTouchEvent(
         event, m_rootView->shared_from_this());
   }
   ```

因此，从视觉和原生输入归属看，Modal 已经是一个独立 Dialog；但从 RNOH 的 C++ 逻辑树看，它仍然挂在 A 页面下面。

### 2.2 原通用触摸判断错误继承了 A 页状态

`CppComponentInstance` 的通用实现会先递归检查逻辑父节点：

```cpp
bool canHandleTouch() const override {
  auto parent = m_parent.lock();
  if (parent && !parent->canChildrenHandleTouch()) {
    return false;
  }
  // 再判断组件自身 pointerEvents
}

bool canChildrenHandleTouch() const override {
  auto parent = m_parent.lock();
  if (parent && !parent->canChildrenHandleTouch()) {
    return false;
  }
  // 再判断组件自身 pointerEvents
}
```

React Navigation 从 A 跳转到 B 后，为了让 A 页面失去交互能力，会把 A 页面相关容器设置为不允许子节点接收触摸，例如 `pointerEvents="none"`。

此时 Modal 虽然已经显示在独立 ArkUI Dialog 中，但原通用判断仍沿着 `m_parent` 回到 A 页面：

```text
Modal
  → A 页面内 View
    → pointerEvents = none
      → canChildrenHandleTouch() = false
        → Modal canHandleTouch() = false
        → Modal canChildrenHandleTouch() = false
```

`TouchEventDispatcher` 在 Modal 根节点处就得到两个 `false`，因此不会继续查找 Modal 内部的 `Pressable` 或 `TouchableOpacity`：

```cpp
bool canHandleTouch = target->canHandleTouch() && ...;
bool canChildrenHandleTouch = target->canChildrenHandleTouch() && ...;

if (canChildrenHandleTouch) {
  // 只有为 true 才遍历 Modal 子节点
}
```

### 2.3 日志证据

正常场景日志：

```text
modal_touch_normal.log
```

关键结果：

```text
Modal parent = RootView
Modal canHandleTouch = 1
Modal canChildrenHandleTouch = 1
target-hit
Modal 关闭按钮 onPress 已送达 JS
```

异常场景日志：

```text
modal_touch_abnormal.log
```

关键结果：

```text
Modal parent = A 页面 View
A 页面祖先 pointerEvents = none
Modal canHandleTouch = 0
Modal canChildrenHandleTouch = 0
target-miss
```

异常日志同时证明 ArkUI 的触摸事件已经到达 `ModalHostTouchHandler`。因此问题不是：

- ArkUI Dialog 没收到触摸；
- 按钮没有注册 JS `onPress`；
- 触摸被 B 页面先消费；
- Modal 视觉层已经失效。

真正丢失发生在：

```text
ArkUI Dialog 已收到触摸
  → RNOH TouchEventDispatcher 开始命中
    → Modal 错误继承 A 页 pointerEvents=none
      → 在 Modal 根节点直接 target-miss
        → 事件没有送达 JS
```

### 2.4 最终根因

根因不是简单的“Modal 视觉层与触摸层不同步”，更精确的结论是：

> 鸿蒙 Modal 的内容和原生触摸入口已经位于独立 ArkUI Dialog 中，但 `ModalHostViewComponentInstance` 仍复用了普通页面组件的触摸判断，错误地沿 React 逻辑父链继承 A 页的 `pointerEvents`。路由切换把 A 页设置为不可交互后，独立 Dialog 的 Modal 根也被错误判定为不可处理触摸，导致命中在根节点终止。

Android 和 iOS 的 Modal 内容同样使用独立原生触摸根，外部页面 View 的 `pointerEvents` 不会跨越 Dialog 或 ViewController 去禁用 Modal 内容。因此鸿蒙原行为与 RN 其他平台的 Modal 输入边界不一致。

## 第三部分：当前方案如何解决此问题

### 3.1 在 Dialog 触摸根处终止外部页面的 `pointerEvents` 继承

新增的两个接口只判断 Modal 自身的 `pointerEvents`，不再继续检查 Dialog 外部的 A 页面：

```cpp
bool ModalHostViewComponentInstance::canHandleTouch() const;
bool ModalHostViewComponentInstance::canChildrenHandleTouch() const;
```

四种模式仍保持 RN 原有语义：

| Modal 自身 `pointerEvents` | Modal 自身可命中 | Modal 子节点可命中 |
|---|---:|---:|
| `auto` | 是 | 是 |
| `none` | 否 | 否 |
| `box-only` | 是 | 否 |
| `box-none` | 否 | 是 |

所以该修改不是无条件放开 Modal，而是把触摸边界从错误的“A 页面逻辑树”修正为“独立 Dialog 根”：

```text
修改前：
Modal 是否可触摸
  = A 页面及全部外部祖先允许
  && Modal 自身 pointerEvents 允许

修改后：
Modal 是否可触摸
  = Modal 自身 pointerEvents 允许
```

Modal 内部的普通 View 没有修改，仍使用 `CppComponentInstance` 的通用递归逻辑。因此 Modal 内部设置的 `none`、`box-only` 等状态仍会正常阻止对应子树，不会被本方案绕过。

### 3.2 恢复异常场景的完整分发链路

修复后的异常场景链路变为：

```text
A 页面 pointerEvents = none
  → 只负责禁止 A 页面普通子树交互

独立 ArkUI Dialog 收到触摸
  → ModalHostTouchHandler
    → TouchEventDispatcher(rootTarget = Modal)
      → Modal 只检查自身 pointerEvents
        → canChildrenHandleTouch = true
          → 继续遍历 Modal 内部子树
            → 命中关闭按钮
              → onPress 送达 JS
                → visible=false
                  → Modal 正常关闭
```

这与 Android、iOS 的独立 Modal 输入根语义一致。

### 3.3 保护页面树中 `m_virtualNode` 的原有行为

Modal 内容位于独立 Dialog，但 `m_virtualNode` 仍作为全屏占位节点挂在页面 ArkUI 树中。

如果只覆写两个 `can*` 接口，`m_virtualNode` 的 ArkUI 原生命中拦截也会使用新的“忽略外部父链”结果。在 API 12 等低版本 ArkUI 命中模式下，理论上可能改变页面占位节点对兄弟节点的原生拦截行为。

因此方案同时覆写：

```cpp
void onArkUINodeTouchIntercept(
    const ArkUI_UIInputEvent* event) override;
```

其处理规则为：

1. 如果页面父节点不允许子节点触摸，保持补丁前行为：
   - API 20 及以上使用 `HTM_BLOCK_DESCENDANTS`；
   - API 20 以下使用 `HTM_NONE`。
2. 如果页面父节点允许触摸，继续复用 `CppComponentInstance` 原有实现。

由此把两种输入上下文明确分开：

| 输入上下文 | 使用的触摸语义 |
|---|---|
| 独立 Dialog 的 `m_rootCustomNode` | Modal 是触摸根，不继承 A 页面状态 |
| 页面树中的 `m_virtualNode` | 保持原有祖先感知和 ArkUI 拦截行为 |

这项保护确保修复只作用于真正需要修复的 Dialog 分发链路，不改变页面普通触摸行为。

### 3.4 对原有行为和性能的影响

- **外部祖先原本允许触摸时**：修改前后结果完全相同。
- **外部祖先禁止触摸时**：
  - 页面普通子树仍然被禁止；
  - 只有独立 Dialog 中的 Modal 恢复交互。
- **透明 Modal**：只改变背景视觉效果，Dialog 仍为 modal mode，不会因此把触摸穿透给 B 页面。
- **嵌套 Modal**：每个 Modal 均以自己的 Dialog 作为输入根，内层 Modal 不会被外层页面状态错误禁用。
- **生命周期和动画**：没有修改 Dialog 的创建、显示、关闭、销毁、动画或 active touch cancel。
- **ABI**：只覆写已有虚接口，没有增加成员变量，对象大小不变。
- **线程安全**：只读取现有 props 和 parent，没有增加共享状态。
- **性能**：Dialog 命中不再递归检查外部页面父链，减少了弱引用锁和父链调用；没有新增分配、监听或额外遍历，不会产生性能回退。

核心的两个 `can*` 修复已经在模拟器复现场景中确认能够恢复 Modal 按钮点击。最终增加的 `onArkUINodeTouchIntercept` 只负责让页面占位节点保持补丁前行为，不参与 Dialog 内部事件分发。
