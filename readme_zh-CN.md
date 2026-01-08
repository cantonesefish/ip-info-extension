简体中文|[English](readme.md)

# 双栈 IP 信息工具

![版本 1.0.0](https://img.shields.io/badge/version-1.0.0-blue) ![Manifest V3](https://img.shields.io/badge/manifest-v3-green) ![MIT 许可证](https://img.shields.io/badge/license-MIT-lightgrey)

一款功能强大的现代化 Chrome 扩展，旨在可视化当前网站和本地网络环境的 IPv4 和 IPv6 信息。它具备高级检测功能，可识别 Cloudflare 数据中心、Anycast 网络以及分隧道（国内/全球）环境。


## ✨ 主要功能

### 🌐 当前站点分析
- **显示真实服务器 IP**（IPv4/IPv6）
- **协议检测**：识别连接协议（HTTP/1.1、HTTP/2、HTTP/3 QUIC）
- **Cloudflare 深度分析**：自动检测 Cloudflare IP，通过 `/cdn-cgi/trace` 探测特定 Colo（数据中心），并将其映射到实际城市/国家
- **Anycast 检测**：识别主要 Anycast 服务提供商（Cloudflare、Google、AWS、Akamai 等），并隐藏误导性的地理位置数据

### 🏠 本地网络环境
- **双源检测**：从国内（`ipw.cn`）和全球（`agi.li`）两个来源获取 IP
- **智能分视图**：如果国内出口和全球出口 IP 不同，自动分离显示
- **完整的 IPv4 和 IPv6 支持**

### 🎨 现代化 UI/UX
- **磨砂玻璃设计**：美观的毛玻璃效果
- **深色/浅色模式**：根据系统自动检测，并提供手动切换开关
- **响应式布局**：动态适应内容

### 🌍 国际化（i18n）
- 原生支持英语（en-US）和简体中文（zh-CN）
- 根据浏览器语言设置自动切换

## 🛠 安装方法

由于此扩展尚未上架 Chrome 网上应用店，您可以通过开发者模式进行安装：

1. 将此仓库下载或克隆到本地机器
2. 打开 Chrome 并访问 `chrome://extensions/`
3. 在右上角启用开发者模式
4. 点击"加载已解压的扩展程序"
5. 选择包含扩展文件的文件夹（包含 `manifest.json` 的文件夹）

或直接下载源代码zip在扩展页面打开开发人员选项拖入zip文件进行安装。

## ⚙️ 配置（API 令牌）

要获取详细的地理位置数据（城市、ISP、ASN、公司），此扩展依赖于 ipinfo.io API：

1. 在 [ipinfo.io](https://ipinfo.io/) 注册免费账户
2. 复制您的访问令牌
3. 点击扩展图标打开弹出窗口
4. 点击控制面板中的"令牌"按钮
5. 粘贴您的令牌并点击"保存"

> **注意**：没有令牌，扩展无法查询IP信息。

## 📂 项目结构

```
/
├── _locales/              # 国际化语言文件（en, zh_CN）
├── flags/                 # IP 卡片的 SVG 国旗
├── flags-png/             # 扩展工具栏图标的 PNG 国旗
├── background.js          # 服务工作线程（IP 获取、图标更新）
├── cloudflare.json        # Cloudflare Colo 代码到位置的映射
├── manifest.json          # 扩展配置
├── popup.html             # 扩展界面
├── popup.css              # 玻璃态样式
├── popup.js               # 主要逻辑
└── icon.png               # 扩展图标
```

## 📡 数据源与隐私

此扩展会与以下服务通信以获取 IP 信息。**不会收集或向开发者发送任何用户数据**。

- **ipinfo.io**：用于查询 IP 地理位置详情（ASN、国家、城市）
- **4.ipw.cn / 6.ipw.cn**：用于检查国内（CN）公网 IP
- **ipv4.agi.li / ipv6.agi.li**：用于检查全球公网 IP
- **当前标签页**：扩展会请求当前标签页的 IP 以显示服务器信息，并执行最小脚本来检查 HTTP 协议版本

## 🤝 贡献指南

欢迎贡献！如果您想改进 UI、提供翻译或进行功能改进：

1. Fork 本项目
2. 创建您的功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交您的更改（`git commit -m '添加一些 AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 创建 Pull Request

## 📄 许可证

根据 MIT 许可证分发。有关更多信息，请参阅 `LICENSE` 文件。

## 本项目用到的一些资源

1.国家/地区旗帜：https://github.com/xykt/ISO3166
2.获取本机IP：https://github.com/miantiao-me/ip-api

---

**用心制作** ❤️
```
