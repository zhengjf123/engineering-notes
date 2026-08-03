# Windows 搭建 React Native Android 开发环境

> 适用范围：Windows 10/11 x64，设备已经安装 Git、Node.js 和 npm，但尚未安装 JDK、Android Studio、Android SDK；目标是搭建 RN 0.72、0.77、0.82 三个原生 Android 工程的开发环境。  
> 整理日期：2026-07-29。通用步骤以 React Native、Android、Node.js、Gradle 等官方文档为准；SDK/NDK 版本以本地工程源码为准。

> **重要：** 新电脑不直接复制当前三个工程目录。先检查设备现有的 Git、Node.js、npm 和 npx，再按照第 11 节的命令从 npm 拉取指定版本的 React Native 模板并重新生成三个工程；随后完成 Android 环境配置和构建验证。

## 1. 已有软件与仍需安装的软件

### 设备已经安装，只需检查

| 软件 | 检查命令 | 要求 |
| --- | --- | --- |
| Git | `git --version` | 命令可正常执行 |
| Node.js | `node --version` | 为同时覆盖三个工程，应不低于 20.19.4 |
| npm | `npm --version` | 命令可正常执行 |
| npx | `npx --version` | 随 npm 提供，拉取 Community CLI 时需要 |

### 仍需安装

| 软件/组件 | 本文建议 | 用途 |
| --- | --- | --- |
| Microsoft OpenJDK | JDK 17 x64 | 运行 Gradle 和 Android Gradle Plugin |
| Android Studio | 官方 Stable 版 | 安装和管理 Android SDK、模拟器、NDK、CMake |
| Android SDK Platform | API 33、35、36 | 分别满足三个工程的 `compileSdk` |
| Android SDK Build-Tools | 33.0.0、35.0.0、36.0.0 | 分别满足三个工程的构建配置 |
| Android SDK Platform-Tools | 最新稳定版 | 提供 `adb` |
| Android SDK Command-line Tools | latest | 提供 `sdkmanager` 等工具 |
| Android Emulator | 最新稳定版 | 使用 Android 模拟器时需要 |
| CMake | 3.22.1 | RN 新架构的 Android C/C++ 构建 |
| NDK (Side by side) | 23.1.7779620、27.1.12297006 | 分别满足 RN 0.72 与 RN 0.77/0.82 |
| Android 设备 | 模拟器或开启调试的真机，二选一 | 安装和运行应用 |

### 不需要单独安装

- 设备已有的 Git、Node.js 和 npm 通过第 4、5 节检查后，无需重复安装。
- 不要求安装 nvm-windows；本文直接使用设备现有的 `node`、`npm` 和 `npx`。
- 不要全局安装 `react-native-cli`。工程自己的依赖和 `npm run android`/`npx react-native` 会调用匹配版本。
- 不要全局安装 Gradle。三个工程都提供了 `android\gradlew.bat`，官方也推荐使用 Gradle Wrapper。
- 不需要安装 Yarn 或 pnpm；三个工程均使用 `package-lock.json`，本文统一使用 npm。
- 不需要单独安装 Kotlin、`adb`、CMake 或 NDK；这些由 Android Studio 的 SDK Manager 安装。
- Windows 上不要求安装 Watchman。
- 仅构建 Android 不需要 Xcode、CocoaPods、Visual Studio，也不需要 macOS。
- VS Code 等代码编辑器是可选项，不影响 Android 构建环境是否成立。

## 2. 本地三个工程的真实版本要求

以下数据来自本目录中的 `package.json`、`android\build.gradle`、`android\gradle.properties` 和 React Native Gradle Plugin：

| 工程 | RN | `engines.node` | min/compile/target SDK | Build-Tools | NDK | AGP | Gradle Wrapper | 新架构 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `RN_72_2026_0515` | 0.72.17 | `>=16` | 21 / 33 / 33 | 33.0.0 | 23.1.7779620 | 7.4.2 | 8.0.1 | 关闭 |
| `RN_77_2026_0515` | 0.77.0 | `>=18` | 24 / 35 / 34 | 35.0.0 | 27.1.12297006 | 8.7.2 | 8.10.2 | 开启 |
| `RN_82_2026_0516` | 0.82.0 | `>=20` | 24 / 36 / 36 | 36.0.0 | 27.1.12297006 | 8.12.0 | 9.0.0 | 开启 |

React Native 0.82 官方文档要求 Node 20.19.4 或更高并推荐 JDK 17。因此，设备现有 Node.js 不低于 20.19.4 时可以直接使用；推荐使用仍受支持的 LTS 版本。不要仅因为三个工程版本不同就重复安装三套 Node.js。

## 3. 安装前检查电脑

### 系统和硬件

- 使用 64 位 Windows 10 或 Windows 11。当前 Android Studio 不支持 Windows ARM 电脑。
- 只用 Android Studio：至少 8 GB 内存。
- 同时使用 Android Studio 和模拟器：至少 16 GB，推荐 32 GB。
- 建议在 SSD 上至少预留 40 GB；三套 SDK/Build-Tools、两套 NDK、CMake、模拟器镜像和 Gradle/npm 缓存都需要空间。
- 使用模拟器时，CPU 必须支持虚拟化，并在 BIOS/UEFI 中开启 Intel VT-x 或 AMD-V/SVM。
- 如果电脑性能或磁盘不足，可直接使用 Android 真机，跳过系统镜像和模拟器配置。

### 新电脑推荐执行顺序

本文为了便于查阅，先集中说明各类环境组件。新电脑实际操作时建议按下面的顺序：

1. 完成第 3～5 节：检查系统以及设备现有的 Git、Node.js、npm、npx。
2. 执行第 11 节：用三条 Community CLI 命令从 npm 拉取并生成三个 RN 工程。
3. 完成第 6～10 节：安装 JDK、Android Studio、SDK/NDK/CMake，并准备模拟器或真机。
4. 完成第 12～15 节：检查依赖、首次构建、运行和最终验收。

### 建议目录

新电脑只需先创建一个空的工作目录。不要从旧电脑复制三个工程、`node_modules`、构建缓存或本地 Gradle ZIP。第 11 节的命令执行完成后会生成：

```text
D:\RN\An
├─ RN_72_2026_0515
├─ RN_77_2026_0515
└─ RN_82_2026_0516
```

新生成的工程使用各自模板声明的标准 Gradle Wrapper，需要时会从 Gradle 官方地址下载对应版本，不依赖旧电脑中的离线 ZIP。

工程目录、Android SDK 目录尽量不要放在 OneDrive、中文目录或层级很深的目录中，可减少路径长度、文件锁和转义问题。没有 D 盘时可换成其他本地磁盘，但后文命令中的根路径也要一起修改。

## 4. 检查设备现有的 Git

设备已经安装 Git，不需要重新下载安装。打开一个新的 PowerShell，执行：

```powershell
git --version
where.exe git
```

能显示 Git 版本和 `git.exe` 路径即成功。

如需在新电脑提交代码，再配置自己的身份：

```powershell
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

## 5. 检查设备现有的 Node.js、npm 和 npx

设备已经安装 Node.js 和 npm，不需要重复安装。打开新的 PowerShell，执行：

```powershell
node --version
npm --version
npx --version
where.exe node
where.exe npm
where.exe npx
```

检查结果应满足：

- `node --version` 不低于 `v20.19.4`；满足时直接使用当前版本。
- `npm --version`、`npx --version` 都能正常输出版本。
- `where.exe` 不应显示多套相互冲突的 Node/npm 路径。

如果 Node 版本低于 20.19.4，再从 [Node.js 官方下载页](https://nodejs.org/en/download)升级到受支持的 Windows x64 LTS 版本。升级后重新打开 PowerShell，并再次执行以上检查。环境满足要求时不要为了搭建这三个工程重复安装 Node.js。

## 6. 安装 JDK 17

本目录的 RN 0.77 和 RN 0.82 使用 AGP 8.x，而 Android 官方明确要求 AGP 8.x 使用 JDK 17。JDK 17 也可作为这三个工程的统一 Java 环境。

1. 打开 [Microsoft Build of OpenJDK 官方下载页](https://learn.microsoft.com/java/openjdk/download)。
2. 在 **OpenJDK 17 → Windows → x64** 中下载 MSI。
3. 安装时启用以下选项：
   - 将 Java 加入 `PATH`。
   - 设置 `JAVA_HOME`。
4. 重新打开 PowerShell，执行：

```powershell
java -version
javac -version
$env:JAVA_HOME
where.exe java
```

正确结果应满足：

- `java -version` 和 `javac -version` 的主版本均为 `17`。
- `JAVA_HOME` 指向 JDK 根目录，例如 `C:\Program Files\Microsoft\jdk-17...`，不能指向其 `bin` 子目录。
- `where.exe java` 的第一项应是本次安装的 JDK 17，而不是旧 Java 或 Oracle JRE。

## 7. 安装 Android Studio

1. 从 [Android Studio 官方下载页](https://developer.android.com/studio)下载 Windows x64 的 Stable `.exe`。
2. 运行安装程序，保留以下组件：
   - Android Studio
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device
3. 首次启动选择 Standard Setup，等待向导结束。
4. 不要使用 Canary/Preview 版作为主环境。

截至本文日期，官方 Stable 版能够识别本目录的 AGP 7.4、8.7、8.12。若 Android Studio提示升级工程的 AGP 或 Gradle，不要直接点击升级；这些版本属于工程构建配置，环境搭建不应顺手修改工程。

### 统一 Android Studio 与命令行的 JDK

打开：

```text
File
→ Settings
→ Build, Execution, Deployment
→ Build Tools
→ Gradle
→ Gradle JDK
```

选择上一步安装的 JDK 17 或 `JAVA_HOME`，避免 Android Studio 用一个 JDK、PowerShell 中的 `gradlew.bat` 又用另一个 JDK。

## 8. 安装完整 Android SDK、NDK 和 CMake

在 Android Studio Welcome 页面进入：

```text
More Actions → SDK Manager
```

已打开工程时也可以进入：

```text
Tools → SDK Manager
```

先记下窗口顶部显示的 **Android SDK Location**。默认一般是：

```text
C:\Users\<Windows用户名>\AppData\Local\Android\Sdk
```

如果 C 盘空间不足，可以在第一次安装 SDK 时选择例如 `D:\Android\Sdk`，后续所有环境变量必须使用这个实际路径。

### 8.1 SDK Platforms

打开 **SDK Platforms**，勾选右下角 **Show Package Details**，安装：

- Android 13 / API 33
  - Android SDK Platform 33
- Android 15 / API 35
  - Android SDK Platform 35
- Android 16 / API 36
  - Android SDK Platform 36
- 需要模拟器时，再选择一个系统镜像：
  - 推荐 `Android 15 / API 35 / Google APIs / x86_64 System Image`

只需要安装一个常用模拟器镜像；“编译所需 Platform”与“运行模拟器所需 System Image”不是同一个组件。

### 8.2 SDK Tools

打开 **SDK Tools**，勾选 **Show Package Details**，安装：

- Android SDK Build-Tools
  - 33.0.0
  - 35.0.0
  - 36.0.0
- Android SDK Platform-Tools
- Android SDK Command-line Tools (latest)
- Android Emulator
- CMake
  - 3.22.1
- NDK (Side by side)
  - 23.1.7779620
  - 27.1.12297006
- Google USB Driver
  - 使用 Google/Pixel 真机时安装；其他品牌还可能需要厂商自己的 OEM USB 驱动

点击 **Apply → OK**，接受 Android SDK License，等待全部下载完成。NDK 必须通过 **Show Package Details** 选择精确版本，不能只安装列表中默认的最新版。

### 8.3 可选：用 sdkmanager 精确补装

完成环境变量配置并重新打开 PowerShell 后，也可以用下面的命令补装或核对全部包：

```powershell
$sdkManager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

& $sdkManager `
  "platform-tools" `
  "emulator" `
  "platforms;android-33" `
  "platforms;android-35" `
  "platforms;android-36" `
  "build-tools;33.0.0" `
  "build-tools;35.0.0" `
  "build-tools;36.0.0" `
  "cmake;3.22.1" `
  "ndk;23.1.7779620" `
  "ndk;27.1.12297006" `
  "system-images;android-35;google_apis;x86_64"

& $sdkManager --licenses
```

逐项阅读并按提示接受许可证。使用 Android Studio 图形界面安装完成后，不必重复执行安装命令。

## 9. 配置 Windows 环境变量

在 Windows 搜索并打开“编辑账户的环境变量”，创建或修改以下**用户变量**。

### `JAVA_HOME`

值为 JDK 17 根目录，例如：

```text
C:\Program Files\Microsoft\jdk-17.0.x
```

### `ANDROID_HOME`

值为 SDK Manager 顶部显示的真实 SDK 路径。默认示例：

```text
C:\Users\<Windows用户名>\AppData\Local\Android\Sdk
```

Android 官方已将 `ANDROID_SDK_ROOT` 标记为废弃。新环境只设置 `ANDROID_HOME` 即可；如果公司脚本必须保留 `ANDROID_SDK_ROOT`，其值必须与 `ANDROID_HOME` 完全一致。

### `Path`

向用户 `Path` 中分别新增：

```text
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\cmdline-tools\latest\bin
```

保存后关闭所有旧 PowerShell、CMD、VS Code 和 Android Studio 窗口，再重新打开，使新变量生效。

### 验证环境变量

在新的 PowerShell 中执行：

```powershell
$env:JAVA_HOME
$env:ANDROID_HOME

git --version
node --version
npm --version
npx --version
java -version
javac -version
adb version
sdkmanager --version

where.exe node
where.exe java
where.exe adb
```

任何命令提示“无法识别”时，先检查路径拼写并确认当前终端是在保存环境变量之后重新打开的。

## 10. 准备模拟器或 Android 真机

两种设备方式二选一即可。真机通常更省电脑资源；模拟器更适合快速切换 Android 版本和屏幕尺寸。

### 10.1 使用 Android 模拟器

#### 开启硬件虚拟化

1. 在 BIOS/UEFI 中开启 Intel VT-x 或 AMD-V/SVM。
2. Windows 搜索“启用或关闭 Windows 功能”。
3. 勾选 **Windows Hypervisor Platform**。
4. 重启电脑。
5. 验证加速：

```powershell
& "$env:ANDROID_HOME\emulator\emulator.exe" -accel-check
```

结果应包含 `is installed and usable`。Android 官方当前推荐 Windows Hypervisor Platform；旧的 Android Emulator Hypervisor Driver 将于 2026-12-31 停止支持，因此新电脑不建议继续按旧教程安装 HAXM/AEHD。

#### 创建 AVD

1. Android Studio Welcome 页面选择 **More Actions → Virtual Device Manager**。
2. 点击 **Create Virtual Device**。
3. 选择一款常见 Pixel Phone。
4. 选择已安装的 **API 35 Google APIs x86_64** 镜像。
5. 保留默认配置并完成创建。
6. 点击启动按钮，等模拟器进入桌面。

验证：

```powershell
emulator -list-avds
adb devices
```

`adb devices` 中应出现类似 `emulator-5554    device`。

### 10.2 使用 Android 真机

1. 手机进入“设置 → 关于手机”，连续点击“版本号/Build number”七次，开启开发者选项。
2. 在开发者选项中开启 **USB 调试**。
3. 用支持数据传输的 USB 线连接电脑。
4. Windows 如未识别设备：
   - Pixel 安装 SDK Manager 中的 Google USB Driver。
   - 其他品牌安装 Android 官方页面链接的 OEM USB Driver。
5. 手机弹出 RSA 指纹授权时选择允许。
6. 执行：

```powershell
adb devices
```

正确状态是：

```text
设备序列号    device
```

如果显示 `unauthorized`，解锁手机并接受授权；仍未恢复时执行：

```powershell
adb kill-server
adb start-server
adb devices
```

真机运行 RN 开发包时，将电脑的 Metro 端口反向映射给手机：

```powershell
adb reverse tcp:8081 tcp:8081
```

## 11. 在新电脑用命令拉取并生成三个工程

当前 RN 0.72、RN 0.77 目录不是 Git 仓库，RN 0.82 也没有配置远程仓库，因此不能通过 `git clone` 还原这三个目录。新电脑应使用 React Native Community CLI 从 npm 拉取指定 RN 版本的官方模板并重新生成工程。

> 这些命令生成的是对应版本的干净 React Native 工程，不包含当前电脑中未提交的业务代码或本地修改。如果将来还要还原业务改动，必须先把改动提交并推送到有远程地址的 Git 仓库。

### 11.1 前置条件

执行前至少完成：

- 第 4 节：确认设备现有 Git 可用。
- 第 5 节：确认设备现有 Node.js 不低于 20.19.4，且 npm、npx 可用。
- 确保 `D:\RN\An` 下不存在同名的三个工程目录，否则 CLI 会拒绝初始化或混入旧文件。
- 确保 npm 网络可用：

```powershell
git --version
node --version
npm --version
npx --version
npm ping
```

### 11.2 创建根目录

```powershell
New-Item -ItemType Directory -Path D:\RN\An -Force
Set-Location D:\RN\An
```

### 11.3 拉取 RN 0.72.17

RN 0.72 工程实际使用 Community CLI 11.4.1。该版本使用 `--npm` 参数指定 npm：

```powershell
npx --yes @react-native-community/cli@11.4.1 init RN_72_2026_0515 --version 0.72.17 --npm
```

### 11.4 拉取 RN 0.77.0

RN 0.77 工程实际使用 Community CLI 15.0.1：

```powershell
npx --yes @react-native-community/cli@15.0.1 init RN_77_2026_0515 --version 0.77.0 --pm npm
```

### 11.5 拉取 RN 0.82.0

RN 0.82 工程实际使用 Community CLI 20.0.0：

```powershell
npx --yes @react-native-community/cli@20.0.0 init RN_82_2026_0516 --version 0.82.0 --pm npm
```

每条命令都会从 npm 下载指定 CLI 和 React Native 模板，创建工程并安装 npm 依赖。一个工程初始化成功后再执行下一个，不要并行运行三个初始化命令。

### 11.6 验证拉取结果

```powershell
$projects = @(
  "D:\RN\An\RN_72_2026_0515",
  "D:\RN\An\RN_77_2026_0515",
  "D:\RN\An\RN_82_2026_0516"
)

foreach ($project in $projects) {
  $packageJson = Get-Content "$project\package.json" -Raw | ConvertFrom-Json
  [PSCustomObject]@{
    Project = $packageJson.name
    ReactNative = $packageJson.dependencies.'react-native'
    HasAndroid = Test-Path "$project\android\gradlew.bat"
  }
}
```

预期分别显示 RN 版本 `0.72.17`、`0.77.0`、`0.82.0`，且三项 `HasAndroid` 均为 `True`。

再检查三个工程的 Gradle Wrapper 不能指向旧电脑的本地路径：

```powershell
Get-ChildItem D:\RN\An\RN_*\android\gradle\wrapper\gradle-wrapper.properties |
  Select-String -Pattern '^distributionUrl='
```

正常的新工程应使用 `https://services.gradle.org/distributions/...`，不应出现 `file:///D:/...` 或指向旧电脑文件的相对路径。

## 12. 确认或重新安装工程依赖

第 11 节的 `init` 命令默认已经使用 npm 安装依赖并生成 `package-lock.json`。初始化成功后不需要立刻重复执行 `npm ci`，先运行环境检查：

```powershell
Set-Location D:\RN\An\RN_82_2026_0516
npx react-native doctor
```

然后分别检查：

```powershell
Set-Location D:\RN\An\RN_77_2026_0515
npx react-native doctor

Set-Location D:\RN\An\RN_72_2026_0515
npx react-native doctor
```

只有在 `node_modules` 缺失、依赖安装中断，或后来重新拉取了带 `package-lock.json` 的工程时，才在对应工程根目录执行：

```powershell
npm ci
```

`npm ci` 会严格按锁文件重建 `node_modules`。不要把某一个工程的 `node_modules` 复制给另一个工程，也不要混用 Yarn 或 pnpm。

如果 PowerShell 报 `npm.ps1` 或 `npx.ps1` 禁止执行，可以不修改系统执行策略，直接使用：

```powershell
npm.cmd ci
npx.cmd react-native doctor
```

## 13. 首次构建和运行

建议先验证最完整的 RN 0.82，再验证 RN 0.77 和 RN 0.72。

### 13.1 验证 Gradle、JDK 和 Android SDK

```powershell
Set-Location D:\RN\An\RN_82_2026_0516\android
.\gradlew.bat --version
.\gradlew.bat assembleDebug --stacktrace
```

检查：

- `.\gradlew.bat --version` 显示 Gradle 9.0.0。
- JVM 显示 Java 17。
- `assembleDebug` 最终显示 `BUILD SUCCESSFUL`。
- APK 默认生成在：

```text
D:\RN\An\RN_82_2026_0516\android\app\build\outputs\apk\debug\app-debug.apk
```

随后分别验证：

```powershell
Set-Location D:\RN\An\RN_77_2026_0515\android
.\gradlew.bat --version
.\gradlew.bat assembleDebug --stacktrace

Set-Location D:\RN\An\RN_72_2026_0515\android
.\gradlew.bat --version
.\gradlew.bat assembleDebug --stacktrace
```

预期 Wrapper 版本分别为 8.10.2 和 8.0.1。第一次构建需要下载 Maven 依赖并编译 C/C++，耗时较长属于正常现象。

### 13.2 运行 React Native 开发包

先启动模拟器，或连接已授权的真机，然后执行：

```powershell
adb devices
```

终端一，在工程根目录启动 Metro：

```powershell
Set-Location D:\RN\An\RN_82_2026_0516
npm start
```

终端二，在同一工程根目录安装并启动 Android 应用：

```powershell
Set-Location D:\RN\An\RN_82_2026_0516
npm run android
```

使用真机时，如果应用无法连接 Metro，再执行：

```powershell
adb reverse tcp:8081 tcp:8081
```

RN 0.77 和 RN 0.72 的运行方式相同，只需切换到各自工程根目录。不要同时启动多个占用 8081 端口的 Metro 进程。

## 14. 常见问题

### `SDK location not found`

先确认：

```powershell
$env:ANDROID_HOME
Test-Path "$env:ANDROID_HOME\platform-tools\adb.exe"
```

如果必须使用 `local.properties`，在对应工程的 `android\local.properties` 中写入机器的真实路径，例如：

```properties
sdk.dir=C\:\\Users\\你的用户名\\AppData\\Local\\Android\\Sdk
```

该文件包含机器路径，三个工程均已将其加入 `.gitignore`，不要提交。

### `Android Gradle plugin requires Java 17`

- 确认 `java -version` 为 17。
- 确认 `JAVA_HOME` 指向 JDK 17 根目录。
- 确认 Android Studio 的 **Gradle JDK** 也选择 JDK 17。
- 关闭旧终端和 Android Studio 后重新打开。

### `Failed to find Build Tools revision ...` 或 `android.jar` 不存在

在 SDK Manager 中打开 **Show Package Details**，核对是否安装了对应的 Platform 和 Build-Tools：

- RN 0.72：Platform 33、Build-Tools 33.0.0
- RN 0.77：Platform 35、Build-Tools 35.0.0
- RN 0.82：Platform 36、Build-Tools 36.0.0

### NDK 或 CMake 错误

确认以下目录存在：

```powershell
Test-Path "$env:ANDROID_HOME\ndk\23.1.7779620"
Test-Path "$env:ANDROID_HOME\ndk\27.1.12297006"
Test-Path "$env:ANDROID_HOME\cmake\3.22.1"
```

若缺失，通过 SDK Manager 的 **Show Package Details** 安装精确版本。不要用一个“最新版 NDK”替代工程声明的版本。

### Gradle Wrapper 下载失败或仍指向旧电脑

查看对应工程的：

```text
android\gradle\wrapper\gradle-wrapper.properties
```

通过第 11 节命令新生成的工程应使用 `https://services.gradle.org/distributions/...`。如果看到 `file:///D:/...`、`../../../gradle-dist/...` 或其他旧电脑路径，说明当前目录不是干净生成的官方模板，或者配置被本地修改过；应重新核对生成过程，不要通过复制旧电脑 ZIP 来补环境。

首次执行 `gradlew.bat` 会联网下载工程声明的 Gradle 版本。无需安装全局 Gradle；下载失败时检查网络、代理和 `services.gradle.org` 的访问权限。

### `adb` 无法识别

- 确认已安装 Android SDK Platform-Tools。
- 确认 `%ANDROID_HOME%\platform-tools` 已加入 `Path`。
- 重新打开终端。

### 真机显示 `unauthorized` 或 `offline`

- 解锁手机并接受 USB 调试 RSA 授权。
- 更换支持数据传输的 USB 线或 USB 口。
- 安装对应品牌的 OEM USB 驱动。
- 执行 `adb kill-server`、`adb start-server` 后重新连接。

### 模拟器很慢或无法启动

- BIOS/UEFI 中开启 VT-x 或 AMD-V/SVM。
- Windows 功能中启用 Windows Hypervisor Platform 并重启。
- 执行 `emulator -accel-check`。
- 不要同时运行与虚拟化冲突的其他虚拟机软件。
- 电脑资源不足时改用 Android 真机。

### 应用已安装，但提示无法连接 Metro

```powershell
adb reverse tcp:8081 tcp:8081
adb devices
```

同时确认工程根目录的 `npm start` 仍在运行，且没有其他进程占用 8081。

### Android Studio 提示升级 AGP/Gradle

环境搭建阶段不要自动升级。三个工程已经固定了不同 AGP、Gradle、SDK 和 NDK 组合；升级属于工程改造，需要单独评估和回归测试。

### npm 或 Gradle 下载超时

首次安装需要访问 npm Registry、Google Maven、Maven Central 等服务。优先检查公司代理、防火墙、证书和网络权限，不要随意替换工程仓库地址或锁文件。

## 15. 最终验收清单

新电脑满足以下全部条件，才算 RN Android 环境搭建完成：

- [ ] `git --version` 正常。
- [ ] 设备现有 `node --version` 不低于 20.19.4，`npm --version`、`npx --version` 正常。
- [ ] 三个工程均由第 11 节命令重新生成，RN 版本分别为 0.72.17、0.77.0、0.82.0。
- [ ] 三个 Gradle Wrapper 均未引用旧电脑的本地 ZIP 路径。
- [ ] `java -version` 和 `javac -version` 均为 17。
- [ ] `JAVA_HOME`、`ANDROID_HOME` 指向真实目录。
- [ ] `adb version`、`sdkmanager --version` 正常。
- [ ] API 33、35、36 已安装。
- [ ] Build-Tools 33.0.0、35.0.0、36.0.0 已安装。
- [ ] NDK 23.1.7779620、27.1.12297006 和 CMake 3.22.1 已安装。
- [ ] `adb devices` 至少有一个状态为 `device` 的模拟器或真机。
- [ ] 三个工程的 `.\gradlew.bat --version` 均能运行。
- [ ] 三个工程的 `.\gradlew.bat assembleDebug` 均显示 `BUILD SUCCESSFUL`。
- [ ] `npm start` 能启动 Metro。
- [ ] `npm run android` 能安装并打开应用。

## 16. 官方参考资料

- [React Native 0.82：Set Up Your Environment](https://reactnative.dev/docs/0.82/set-up-your-environment)
- [React Native 0.77：Set Up Your Environment](https://reactnative.dev/docs/0.77/set-up-your-environment)
- [React Native 0.82：Running On Device](https://reactnative.dev/docs/0.82/running-on-device)
- [React Native Community CLI](https://github.com/react-native-community/cli)
- [Android Studio：下载](https://developer.android.com/studio)
- [Android Studio：Windows 安装与系统要求](https://developer.android.com/studio/install)
- [Android SDK Manager 与必需工具](https://developer.android.com/studio/intro/update)
- [Android SDK 环境变量](https://developer.android.com/tools/variables)
- [安装指定 NDK 与 CMake](https://developer.android.com/studio/projects/install-ndk)
- [创建和管理 Android Virtual Device](https://developer.android.com/studio/run/managing-avds)
- [Windows 模拟器硬件加速](https://developer.android.com/studio/run/emulator-acceleration)
- [连接 Android 真机](https://developer.android.com/studio/run/device)
- [Android 构建中的 JDK 版本](https://developer.android.com/build/jdks)
- [Android Gradle Plugin 与 Android Studio 兼容性](https://developer.android.com/build/releases/about-agp)
- [Gradle Wrapper 官方说明](https://docs.gradle.org/current/userguide/gradle_wrapper.html)
- [Microsoft Build of OpenJDK 17 下载](https://learn.microsoft.com/java/openjdk/download)
- [Node.js 官方下载](https://nodejs.org/en/download)
