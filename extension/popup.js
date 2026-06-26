/**
 * Chronicle Bridge — popup.js (Safe Mode)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const badge         = document.getElementById('status-badge');
  const serverInput   = document.getElementById('server-url');
  const loginFields   = document.getElementById('login-fields');
  const emailInput    = document.getElementById('auth-email');
  const passInput     = document.getElementById('auth-password');
  const btnLogin      = document.getElementById('btn-login');
  const connectedUser = document.getElementById('connected-user');
  const userDisplay   = document.getElementById('user-display');
  const cardMain      = document.getElementById('card-main');
  const cardNoPortal  = document.getElementById('card-no-portal');
  const chatTitle     = document.getElementById('chat-title');
  const scrapedCount  = document.getElementById('scraped-count');
  const previewWrap   = document.getElementById('preview-wrap');
  const previewEl     = document.getElementById('preview-container');
  const btnExtract    = document.getElementById('btn-extract');
  const chatLimit     = document.getElementById('chat-limit');
  const btnSync       = document.getElementById('btn-sync');
  const syncLoader    = document.getElementById('sync-loader');
  const syncText      = document.getElementById('sync-text');
  const progressSec   = document.getElementById('progress-section');
  const progressBar   = document.getElementById('progress-bar');
  const progressLabel = document.getElementById('progress-label');
  const toast         = document.getElementById('status-toast');
  const logBox        = document.getElementById('log-box');

  const logLines = [];
  function log(msg) {
    try {
      const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
      logLines.push(`[${ts}] ${msg}`);
      if (logBox) logBox.innerText = logLines.slice(-20).join('\n');
    } catch(e) {}
  }
  function showLog() { if (logBox) { logBox.style.display = 'block'; logBox.scrollTop = logBox.scrollHeight; } }

  log('Popup started.');

  try {
    let activeTab = null;
    let corpus = null;
    let isOnline = false;
    let token = '';
    let platform = null;

    try {
      const stored = await chrome.storage.local.get('chronicle_token');
      token = stored.chronicle_token || '';
      log('Token loaded.');
    } catch (e) {
      log('Token load err: ' + e.message);
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      activeTab = tabs[0];
      if (activeTab?.url) {
        const url = activeTab.url;
        if (url.includes('chatgpt.com')) platform = 'ChatGPT';
        else if (url.includes('claude.ai')) platform = 'Claude';
        else if (url.includes('gemini.google.com')) platform = 'Gemini';
      }
      if (platform) {
        cardNoPortal.style.display = 'none';
        cardMain.style.display = 'block';
        chatTitle.value = `${platform} Full History`;
        btnExtract.innerText = `Extract from ${platform}`;
        log(`Platform detected: ${platform}`);
      }
    } catch (e) {
      log('Tab query err: ' + e.message);
    }

    async function checkServer() {
      const url = serverInput.value.trim().replace(/\/+$/, '');
      log(`Checking server: ${url}`);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout
        
        log('Fetching auth/me...');
        const res = await fetch(`${url}/api/v1/auth/me`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        log(`Server online (status ${res.status})`);
        isOnline = true;
        badge.innerText = 'ONLINE';
        badge.className = 'badge badge-online';

        if (res.ok) {
          const user = await res.json();
          loginFields.style.display = 'none';
          connectedUser.style.display = 'block';
          userDisplay.innerText = user.email;
        } else {
          log('Token invalid — showing login');
          token = '';
          chrome.storage.local.remove('chronicle_token');
          loginFields.style.display = 'block';
          connectedUser.style.display = 'none';
        }
      } catch (err) {
        log(`Server check failed: ${err.name} - ${err.message}`);
        isOnline = false;
        badge.innerText = 'MOCK MODE';
        badge.className = 'badge badge-offline';
        loginFields.style.display = 'none';
        connectedUser.style.display = 'block';
        userDisplay.innerText = 'Offline Sandbox (Mock)';
        showLog(); // auto-show log so user sees the error
      }
    }

    serverInput.addEventListener('change', checkServer);
    
    // Don't block event listener attachment
    checkServer().catch(e => log('Unhandled checkServer error: ' + e.message));

    btnLogin.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const pass = passInput.value;
      if (!email || !pass) return;
      btnLogin.disabled = true;
      btnLogin.innerText = 'Signing in…';
      try {
        const form = new FormData();
        form.append('username', email);
        form.append('password', pass);
        const sUrl = serverInput.value.trim().replace(/\/+$/, '');
        const res = await fetch(`${sUrl}/api/v1/auth/login`, {
          method: 'POST', body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || `HTTP ${res.status}`);
        token = data.access_token;
        await chrome.storage.local.set({ chronicle_token: token });
        log('Login successful');
        await checkServer();
      } catch (e) {
        log('Login error: ' + e.message);
        showLog();
      } finally {
        btnLogin.disabled = false;
        btnLogin.innerText = 'Sign in to Chronicle';
      }
    });

    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action !== 'extractProgress') return;
      const pct = (msg.total && msg.total !== '?') ? Math.min(100, Math.round((msg.fetched / msg.total) * 100)) : null;
      if (pct !== null) progressBar.style.width = `${pct}%`;
      progressLabel.innerText = msg.stage === 'listing' ? 'Listing conversations…' : `Fetched ${msg.fetched} / ${msg.total}`;
    });

    btnExtract.addEventListener('click', () => {
      if (!activeTab) return;
      corpus = null;
      btnSync.disabled = true;
      btnExtract.disabled = true;
      btnExtract.innerText = 'Syncing in Background…';
      progressSec.style.display = 'block';
      progressBar.style.width = '10%';
      progressLabel.innerText = `Command sent. You can safely close this window.`;
      previewWrap.style.display = 'none';

      const fetchLimit = chatLimit ? parseInt(chatLimit.value || '999999') : 999999;
      
      log(`Triggering background sync for tab ${activeTab.id}`);
      chrome.runtime.sendMessage({
        action: 'startBackgroundSync',
        tabId: activeTab.id,
        platform: platform,
        limit: fetchLimit,
        serverUrl: serverInput.value.trim()
      });
    });

    // Listen for completion if popup happens to stay open
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'syncComplete') {
        progressLabel.innerText = `Sync complete!`;
        btnExtract.innerText = 'Sync Complete';
      } else if (msg.action === 'syncError') {
        progressLabel.innerText = `Error: ${msg.error}`;
        progressLabel.style.color = '#ef4444';
        btnExtract.innerText = 'Extraction Failed';
      }
    });

    // Clear Sync Cache
    const btnClearSync = document.getElementById('btn-clear-sync');
    if (btnClearSync) {
      btnClearSync.addEventListener('click', async () => {
        await chrome.storage.local.remove('synced_chat_ids');
        log('Cleared local sync cache.');
        btnClearSync.innerText = 'Cache Cleared!';
        setTimeout(() => btnClearSync.innerText = 'Clear Local Sync Cache', 2000);
      });
    }

  } catch (globalErr) {
    log('GLOBAL ERROR: ' + globalErr.message);
    showLog();
  }
});
