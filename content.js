// content.js - 内容脚本，获取当前页面信息

class ContentScript {
  constructor() {
    this.init();
  }

  init() {
    // 监听来自popup的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getCurrentPageInfo') {
        const pageInfo = {
          url: window.location.href,
          hostname: window.location.hostname,
          origin: window.location.origin
        };
        sendResponse(pageInfo);
      }
      return true;
    });

    // 页面加载完成后发送页面信息到后台
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.sendPageInfo();
      });
    } else {
      this.sendPageInfo();
    }
  }

  sendPageInfo() {
    const pageInfo = {
      url: window.location.href,
      hostname: window.location.hostname,
      origin: window.location.origin,
      title: document.title
    };

    // 发送信息到后台
    chrome.runtime.sendMessage({
      action: 'pageInfo',
       pageInfo
    }).catch(() => {
      // 忽略错误，因为popup可能未打开
    });
  }
}

// 初始化内容脚本
new ContentScript();