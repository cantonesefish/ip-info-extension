English|[简体中文](readme_zh-CN.md)

# Dual-stack IP Info Tool

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Manifest](https://img.shields.io/badge/manifest-v3-green) ![License](https://img.shields.io/badge/license-MIT-lightgrey)

A powerful, modern Chrome Extension designed to visualize IPv4 and IPv6 information for both the current website and your local network environment. It features advanced detection for Cloudflare data centers, Anycast networks, and split-tunneling (Domestic/Global) environments.

## ✨ Key Features

*   **🌐 Current Site Analysis**
    *   Displays the real server IP (IPv4/IPv6).
    *   **Protocol Detection:** Identifies connection protocols (HTTP/1.1, HTTP/2, HTTP/3 QUIC).
    *   **Cloudflare Deep Dive:** Automatically detects Cloudflare IPs, probes the specific **Colo (Data Center)** via `/cdn-cgi/trace`, and maps it to the physical city/country.
    *   **Anycast Detection:** Identifies major Anycast providers (Cloudflare, Google, AWS, Akamai, etc.) and hides misleading geolocation data.

*   **🏠 Local Network Environment**
    *   **Dual-Source Detection:** Fetches IPs from both Domestic (`ipw.cn`) and Global (`agi.li`) sources.
    *   **Smart Split View:** Automatically separates "Domestic Exit" and "Global Exit" IPs if they differ.
    *   Full IPv4 and IPv6 support.

*   **🎨 Modern UI/UX**
    *   **Glassmorphism Design:** Beautiful frosted glass aesthetic.
    *   **Dark/Light Mode:** Automatic system detection with a manual toggle switch.
    *   **Responsive Layout:** Adapts dynamically to content.

*   **🌍 Internationalization (i18n)**
    *   Native support for **English (en-US)** and **Simplified Chinese (zh-CN)**.
    *   Auto-switches based on browser language settings.

## 🛠 Installation

Since this extension is not yet in the Chrome Web Store, you can install it in Developer Mode:

1.  Download or clone this repository to your local machine.
2.  Open Chrome and navigate to `chrome://extensions/`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the folder containing the extension files (the folder with `manifest.json`).

Or you can directly download the source code zip file, open the developer options on the extension page, and drag the zip file for installation.

## ⚙️ Configuration (API Token)

To get detailed geolocation data (City, ISP, ASN, Company), this extension relies on the **ipinfo.io** API.

1.  Sign up for a free account at [ipinfo.io](https://ipinfo.io/).
2.  Copy your access token.
3.  Click the extension icon to open the popup.
4.  Click the **Token** button in the control panel.
5.  Paste your token and click **Save**.

> **Note:** Without a token, the extension cannot query IP information.

## 📂 Project Structure

```text
/
├── _locales/              # i18n language files (en, zh_CN)
├── flags/                 # SVG flags for IP cards
├── flags-png/             # PNG flags for extension toolbar icon
├── background.js          # Service worker (IP fetching, Icon updating)
├── cloudflare.json        # Cloudflare Colo code to location mapping
├── manifest.json          # Extension configuration
├── popup.html             # Extension interface
├── popup.css              # Glassmorphism styles
├── popup.js               # Main logic
└── icon.png               # Extension icon
```

## 📡 Data Sources & Privacy

This extension communicates with the following services to fetch IP information. **No user data is collected or sent to the developer.**

*   **ipinfo.io**: Used for querying IP geolocation details (ASN, Country, City).
*   **4.ipw.cn / 6.ipw.cn**: Used to check Domestic (CN) public IPs.
*   **ipv4.agi.li / ipv6.agi.li**: Used to check Global public IPs.
*   **Your current tab**: The extension requests the current tab's IP to display server information and executes a minimal script to check the HTTP protocol version.

## 🤝 Contributing

Welcome to contribute! If you want to improve the UI, provide translations, or make functional enhancements:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## Some resources used in this project

1. Country/region flags: https://github.com/xykt/ISO3166
2. Obtain the local IP: https://github.com/miantiao-me/ip-api

---

**Made with ❤️**
