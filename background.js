// background.js

const STORAGE_KEY = {
  TOKEN: 'ipinfo_token',
  // 国内 (Domestic)
  DOM_IPV4: 'dom_ipv4_data',
  DOM_IPV6: 'dom_ipv6_data',
  // 国际 (Global)
  GLOB_IPV4: 'glob_ipv4_data',
  GLOB_IPV6: 'glob_ipv6_data',
  
  TAB_IPS: 'tab_ips',
  IP_DETAILS_CACHE: 'ip_cache_'
};

// Anycast 提供商关键字
const ANYCAST_PROVIDERS = {
  'cloudflare': 'cloudflare', 'google': 'google', 'akamai': 'akamai',
  'fastly': 'fastly', 'amazon': 'aws', 'aws': 'aws', 'tencent': 'qq', 'ace': 'qq',
  'microsoft': 'azure', 'azure': 'azure', 'aliyun': 'aliyun', 'alibaba': 'aliyun'
};

// --- 初始化逻辑 ---

chrome.runtime.onStartup.addListener(initAllIps);
chrome.runtime.onInstalled.addListener(initAllIps);

async function initAllIps() {
  const token = await getToken();
  
  // 1. 获取国内 IP (ipw.cn)
  fetchAndCacheIp('https://4.ipw.cn', STORAGE_KEY.DOM_IPV4, 'ipv4', token);
  fetchAndCacheIp('https://6.ipw.cn', STORAGE_KEY.DOM_IPV6, 'ipv6', token);
  
  // 2. 获取国际 IP (agi.li)
  fetchAndCacheIp('https://ipv4.agi.li', STORAGE_KEY.GLOB_IPV4, 'ipv4', token);
  fetchAndCacheIp('https://ipv6.agi.li', STORAGE_KEY.GLOB_IPV6, 'ipv6', token);
}

// 通用 IP 获取与缓存函数
async function fetchAndCacheIp(url, storageKey, type, token) {
  try {
    // 设置超时，避免国际 IP 接口在无代理时卡住
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error('Network error');
    
    const ip = (await response.text()).trim();
    if (ip && token) {
      // 查询详情
      const details = await fetchIpDetails(ip, token);
      // 存入缓存
      await chrome.storage.session.set({ [storageKey]: { ip, details } });
    }
  } catch (e) {
    // 失败时不写入缓存，Popup 会处理空状态
  }
}

// --- 核心监听逻辑 ---

// 1. 监听网络请求获取网站 IP
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (details.tabId !== -1 && details.type === 'main_frame' && details.ip) {
      saveTabIp(details.tabId, details.ip);
    }
  },
  { urls: ["<all_urls>"] }
);

async function saveTabIp(tabId, ip) {
  const data = await chrome.storage.session.get(STORAGE_KEY.TAB_IPS) || {};
  const tabIps = data[STORAGE_KEY.TAB_IPS] || {};
  tabIps[tabId] = ip;
  await chrome.storage.session.set({ [STORAGE_KEY.TAB_IPS]: tabIps });
  
  updateTabIconAndCache(tabId, ip);
}

// 2. 监听标签页切换
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  handleTabChange(activeInfo.tabId);
});

// 3. 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    handleTabChange(tabId);
  }
});

async function handleTabChange(tabId) {
  const data = await chrome.storage.session.get(STORAGE_KEY.TAB_IPS);
  const tabIps = data[STORAGE_KEY.TAB_IPS] || {};
  const ip = tabIps[tabId];

  if (ip) {
    updateTabIconAndCache(tabId, ip);
  } else {
    setSafeIcon(tabId, "icon.png");
  }
}

// --- 图标更新与数据查询 ---

async function updateTabIconAndCache(tabId, ip) {
  const token = await getToken();
  if (!token) {
     setFlagIcon(tabId, null);
     return;
  }

  const cacheKey = `${STORAGE_KEY.IP_DETAILS_CACHE}${ip}`;
  const cachedData = await chrome.storage.session.get(cacheKey);
  let details = cachedData[cacheKey];

  if (!details) {
    details = await fetchIpDetails(ip, token);
    if (details) {
      await chrome.storage.session.set({ [cacheKey]: details });
    }
  }

  if (details) {
    const iconCode = getIconCode(details);
    setFlagIcon(tabId, iconCode);
  } else {
    setFlagIcon(tabId, null);
  }
}

function getIconCode(details) {
  if (!details) return null;
  if (details.anycast === true) {
    const rawText = ((details.org || '') + ' ' + (details.asn || '')).toLowerCase();
    for (const [keyword, filename] of Object.entries(ANYCAST_PROVIDERS)) {
      if (rawText.includes(keyword)) return filename;
    }
  }
  return details.country;
}

async function setFlagIcon(tabId, code) {
  const unknownPath = "flags-png/unknown.png"; 
  let targetPath = unknownPath;

  if (code && typeof code === 'string') {
    targetPath = `flags-png/${code.toLowerCase()}.png`;
  }
  setSafeIcon(tabId, targetPath);
}

async function setSafeIcon(tabId, path) {
  try {
    const response = await fetch(chrome.runtime.getURL(path), { method: 'HEAD' });
    if (response.ok) {
      chrome.action.setIcon({ path: path, tabId: tabId }, () => {
        if (chrome.runtime.lastError) {} 
      });
    } else {
      drawFallbackIcon(tabId);
    }
  } catch (error) {
    drawFallbackIcon(tabId);
  }
}

function drawFallbackIcon(tabId) {
  try {
    const canvas = new OffscreenCanvas(32, 32);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('IP', 16, 16);
    
    const imageData = ctx.getImageData(0, 0, 32, 32);
    chrome.action.setIcon({ imageData: imageData, tabId: tabId }, () => {
      if (chrome.runtime.lastError) {}
    });
  } catch (e) {}
}

// --- 辅助函数 ---

async function fetchIpDetails(ip, token) {
  try {
    const res = await fetch(`https://ipinfo.io/${ip}?token=${token}`);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error(`API Error ${ip}:`, e);
  }
  return null;
}

async function getToken() {
  const res = await chrome.storage.sync.get(STORAGE_KEY.TOKEN);
  return res[STORAGE_KEY.TOKEN];
}

// --- 消息通信 (返回国内和国际两组数据) ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getData') {
    (async () => {
      try {
        const sessionData = await chrome.storage.session.get(null);
        const syncData = await chrome.storage.sync.get(STORAGE_KEY.TOKEN);
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        let currentSiteIp = null;
        let currentSiteDetails = null;

        if (tab && sessionData[STORAGE_KEY.TAB_IPS]) {
          currentSiteIp = sessionData[STORAGE_KEY.TAB_IPS][tab.id];
          if (currentSiteIp) {
            currentSiteDetails = sessionData[`${STORAGE_KEY.IP_DETAILS_CACHE}${currentSiteIp}`];
          }
        }

        sendResponse({
          token: syncData[STORAGE_KEY.TOKEN],
          // 国内组
          domIpv4: sessionData[STORAGE_KEY.DOM_IPV4],
          domIpv6: sessionData[STORAGE_KEY.DOM_IPV6],
          // 国际组
          globIpv4: sessionData[STORAGE_KEY.GLOB_IPV4],
          globIpv6: sessionData[STORAGE_KEY.GLOB_IPV6],
          
          siteIp: currentSiteIp,
          siteDetails: currentSiteDetails
        });
      } catch (e) {
        sendResponse({ error: e.message });
      }
    })();
    return true; 
  }
});