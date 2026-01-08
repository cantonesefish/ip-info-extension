// popup.js

// 字段 Key 映射到 i18n key
const FIELD_KEYS = {
  city: "field_city", 
  region: "field_region", 
  country: "field_country", 
  org: "field_org",
  timezone: "field_timezone", 
  company: "field_company", 
  asn: "field_asn"
};

const ANYCAST_PROVIDERS = {
  'cloudflare': 'cloudflare', 'google': 'google', 'akamai': 'akamai',
  'fastly': 'fastly', 'amazon': 'aws', 'aws': 'aws', 'ace': 'qq', 'tencent': 'qq',
  'microsoft': 'azure', 'azure': 'azure', 'aliyun': 'aliyun', 'alibaba': 'aliyun'
};

class PopupApp {
  constructor() {
    this.cfData = null; 
    this.init();
  }

  async init() {
    this.localizeHtml(); // 1. 执行静态文本翻译
    this.initTheme();
    this.bindEvents();
    
    await Promise.all([
      this.loadCloudflareJson(),
      this.loadData()
    ]);
  }

  // --- I18n 处理 ---
  localizeHtml() {
    // 替换所有带有 data-i18n 属性的元素文本
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const msg = chrome.i18n.getMessage(key);
      if (msg) el.textContent = msg;
    });

    // 特殊处理 input placeholder
    const input = document.getElementById('token-input');
    if (input) input.placeholder = chrome.i18n.getMessage('modal_placeholder');
  }

  // 获取翻译后的文本辅助函数
  t(key) {
    return chrome.i18n.getMessage(key) || key;
  }

  async loadCloudflareJson() {
    try {
      const url = chrome.runtime.getURL('cloudflare.json');
      const res = await fetch(url);
      if (res.ok) this.cfData = await res.json();
    } catch (e) {
      console.warn('Load cloudflare.json failed', e);
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || 
                   (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.body.classList.add('dark-mode');
      this.updateThemeIcon(true);
    } else {
      document.body.classList.remove('dark-mode');
      this.updateThemeIcon(false);
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.updateThemeIcon(isDark);
  }

  updateThemeIcon(isDark) {
    const path = document.querySelector('#icon-theme path');
    if (isDark) {
      path.setAttribute('d', 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z');
    } else {
      path.setAttribute('d', 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z');
    }
  }

  bindEvents() {
    document.getElementById('btn-theme').addEventListener('click', () => this.toggleTheme());
    
    const modal = document.getElementById('token-modal');
    document.getElementById('btn-token').addEventListener('click', async () => {
      const res = await chrome.storage.sync.get('ipinfo_token');
      document.getElementById('token-input').value = res.ipinfo_token || '';
      modal.style.display = 'flex';
    });
    document.getElementById('cancel-token-btn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('save-token-btn').addEventListener('click', async () => {
      await chrome.storage.sync.set({ ipinfo_token: document.getElementById('token-input').value.trim() });
      modal.style.display = 'none';
      this.loadData();
    });

    document.getElementById('btn-refresh').addEventListener('click', () => {
      this.loadData();
      const icon = document.querySelector('#btn-refresh svg');
      icon.style.transition = 'transform 0.5s';
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => { icon.style.transform = ''; icon.style.transition = ''; }, 500);
    });

    document.getElementById('btn-github').addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://github.com/cantonesefish/ip-info-extension' }); 
    });
  }

  async loadData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getData' });
      if (!response || response.error) throw new Error(response?.error || 'Connection failed');

      this.renderSiteIp(response.siteIp, response.siteDetails);
      this.renderNetworkIp(
        response.domIpv4, response.domIpv6,
        response.globIpv4, response.globIpv6
      );
      this.getWebsiteProtocol();

    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Error');
    }
  }

  async getWebsiteProtocol() {
    const protocolEl = document.getElementById('site-protocol');
    protocolEl.textContent = '...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return;
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://')) {
        protocolEl.textContent = 'LOCAL';
        return;
      }

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const entry = performance.getEntriesByType('navigation')[0];
          return entry ? entry.nextHopProtocol : 'unknown';
        }
      });

      if (results && results[0] && results[0].result) {
        let proto = results[0].result;
        if (proto === 'h3') proto = 'HTTP/3';
        if (proto === 'h2') proto = 'HTTP/2';
        if (proto === 'http/1.1') proto = 'HTTP/1.1';
        protocolEl.textContent = proto.toUpperCase();
      } else {
        protocolEl.textContent = 'UNK';
      }
    } catch (e) {
      protocolEl.textContent = '---';
    }
  }

  renderSiteIp(ip, details) {
    const container = document.getElementById('site-ip-info');
    container.innerHTML = '';
    if (!ip) {
      container.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding-top:20px;font-size:12px;">${this.t('msg_no_site_ip')}<br><small>${this.t('msg_refresh_tip')}</small></div>`;
      return;
    }
    container.appendChild(this.createCard(ip, details, 'site'));
  }

  renderNetworkIp(domV4, domV6, globV4, globV6) {
    const container = document.getElementById('network-ip-info');
    container.innerHTML = '';

    const domCountry = (domV4?.details?.country || domV6?.details?.country || '').toUpperCase();
    const globCountry = (globV4?.details?.country || globV6?.details?.country || '').toUpperCase();
    const hasDomData = domV4 || domV6;
    const hasGlobData = globV4 || globV6;
    
    const shouldSplit = hasDomData && hasGlobData && (domCountry !== globCountry);

    if (shouldSplit) {
      // Domestic
      const domSection = document.createElement('div');
      domSection.className = 'network-section';
      domSection.innerHTML = `
        <div class="section-header">
          <img src="${chrome.runtime.getURL('flags/cn.svg')}" class="section-icon">
          <h4 class="section-title">${this.t('sec_domestic')} (Domestic)</h4>
        </div>`;
      if (domV4) domSection.appendChild(this.createCard(domV4.ip, domV4.details, 'ipv4'));
      if (domV6) domSection.appendChild(this.createCard(domV6.ip, domV6.details, 'ipv6'));
      container.appendChild(domSection);

      // Global
      const globSection = document.createElement('div');
      globSection.className = 'network-section';
      globSection.innerHTML = `
        <div class="section-header">
          <img src="${chrome.runtime.getURL('flags/un.svg')}" class="section-icon">
          <h4 class="section-title">${this.t('sec_global')} (Global)</h4>
        </div>`;
      if (globV4) globSection.appendChild(this.createCard(globV4.ip, globV4.details, 'ipv4'));
      if (globV6) globSection.appendChild(this.createCard(globV6.ip, globV6.details, 'ipv6'));
      container.appendChild(globSection);

    } else {
      const v4ToShow = globV4 || domV4;
      const v6ToShow = globV6 || domV6;

      if (v4ToShow) container.appendChild(this.createCard(v4ToShow.ip, v4ToShow.details, 'ipv4'));
      if (v6ToShow) container.appendChild(this.createCard(v6ToShow.ip, v6ToShow.details, 'ipv6'));
      
      if (!v4ToShow && !v6ToShow) {
        container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:12px;">${this.t('msg_detecting')}</div>`;
      }
    }
  }

  createCard(ip, info, type) {
    const card = document.createElement('div');
    card.className = `ip-card ${type}-card`;

    let flagName = 'unknown';
    let isAnycastMatch = false;
    let isCloudflare = false;

    if (info) {
      if (info.anycast === true) {
        const rawText = ((info.org || '') + ' ' + (info.asn || '')).toLowerCase();
        for (const [keyword, filename] of Object.entries(ANYCAST_PROVIDERS)) {
          if (rawText.includes(keyword)) {
            flagName = filename; 
            isAnycastMatch = true;
            if (filename === 'cloudflare') isCloudflare = true;
            break;
          }
        }
      }
      if (!isAnycastMatch && info.country) {
        flagName = info.country.toLowerCase();
      }
    }
    
    const flagImg = `<img src="${chrome.runtime.getURL(`flags/${flagName}.svg`)}" 
                   class="flag-large" onerror="this.src='${chrome.runtime.getURL('flags/unknown.svg')}'">`;
    
    // 使用 i18n 获取卡片标题
    let typeKey = 'type_site';
    if (type === 'ipv4') typeKey = 'type_ipv4';
    if (type === 'ipv6') typeKey = 'type_ipv6';
    const typeLabel = this.t(typeKey);

    let html = `
      <div class="card-header"><span class="card-title">${typeLabel}</span>${flagImg}</div>
      <div class="ip-display">${ip}</div>
    `;

    if (info) {
      html += `<div class="details-grid">`;
      if (info.anycast) html += `<div class="label">${this.t('lbl_type')}:</div><div class="value"><span class="badge-anycast">${this.t('lbl_anycast')}</span></div>`;
      
      let keys = ['org', 'asn'];
      if (!info.anycast) keys = ['city', 'region', 'country', ...keys];

      if (isCloudflare && type === 'site') {
        html += `<div class="label">${this.t('lbl_colo')}:</div><div class="value" id="cf-colo-value">${this.t('msg_probing')}</div>`;
      }

      keys.forEach(k => {
        // 使用 i18n key 获取字段名
        const fieldLabel = FIELD_KEYS[k] ? this.t(FIELD_KEYS[k]) : k;
        if (info[k]) html += `<div class="label">${fieldLabel}:</div><div class="value">${info[k]}</div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="details-grid"><div style="color:orange;font-size:12px;">${this.t('msg_no_info')}</div></div>`;
    }

    card.innerHTML = html;

    if (isCloudflare && type === 'site') {
      this.detectCloudflareColo(card, ip);
    }

    return card;
  }

  async detectCloudflareColo(cardElement, ip) {
    try {
      const traceUrl = `http://${ip}/cdn-cgi/trace`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(traceUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const text = await res.text();
      const match = text.match(/colo=([A-Z]+)/);
      
      if (match && match[1]) {
        this.updateColoDisplay(cardElement, match[1]);
      } else {
        this.updateColoDisplay(cardElement, null, this.t('msg_unknown'));
      }
    } catch (e) {
      this.updateColoDisplay(cardElement, null, this.t('msg_failed'));
    }
  }

  updateColoDisplay(card, code, errorMsg) {
    const valueEl = card.querySelector('#cf-colo-value');
    if (!valueEl) return;

    if (!code) {
      valueEl.textContent = errorMsg || this.t('msg_unknown');
      valueEl.style.color = 'var(--text-secondary)';
      valueEl.style.fontSize = '11px';
      return;
    }

    let displayHtml = `<span style="font-family:var(--font-mono); font-weight:bold;">${code}</span>`;

    if (this.cfData && this.cfData[code]) {
      const data = this.cfData[code];
      const cca2 = data.cca2 ? data.cca2.toLowerCase() : 'unknown';
      displayHtml += ` <span style="font-size:11px; color:var(--text-secondary);">(${data.name})</span>`;
      displayHtml += `<img src="${chrome.runtime.getURL(`flags/${cca2}.svg`)}" class="flag-mini" onerror="this.style.display='none'">`;
    }

    valueEl.innerHTML = displayHtml;
  }

  showToast(msg) {
    const toast = document.getElementById('error-toast');
    if (toast) {
      toast.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => toast.style.opacity = '0', 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupApp();
});