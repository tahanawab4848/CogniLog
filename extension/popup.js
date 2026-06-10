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
      const url = serverInput.value.trim();
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
        const res = await fetch(`${serverInput.value.trim()}/api/v1/auth/login`, {
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
      btnExtract.innerText = 'Extracting…';
      progressSec.style.display = 'block';
      progressBar.style.width = '5%';
      progressLabel.innerText = `Connecting to ${platform}…`;
      previewWrap.style.display = 'none';

      log(`Sending extractAllHistory to tab ${activeTab.id}`);
      chrome.tabs.sendMessage(activeTab.id, { action: 'extractAllHistory' }, (response) => {
        btnExtract.disabled = false;
        btnExtract.innerText = `Extract from ${platform}`;
        progressSec.style.display = 'none';

        if (chrome.runtime.lastError) {
          log('runtime.lastError: ' + chrome.runtime.lastError.message);
          showLog();
          return;
        }
        if (!response?.success) {
          log('Extraction error: ' + response?.error);
          showLog();
          return;
        }

        corpus = response.conversations || [];
        if (!corpus.length) {
          log('No conversations found.');
          showLog();
          return;
        }

        const totalMsgs = corpus.reduce((s, c) => s + c.messages.length, 0);
        scrapedCount.innerText = `${corpus.length} convos · ${totalMsgs} msgs`;
        previewEl.innerHTML = corpus.slice(0, 8).map(c => `<div class="preview-row"><span class="tag tag-conv">${c.title.substring(0, 50)}</span></div>`).join('');
        previewWrap.style.display = 'block';
        btnSync.disabled = false;
        log(`Extracted ${corpus.length} conversations OK`);
      });
    });

    btnSync.addEventListener('click', async () => {
      if (!corpus?.length) return;
      btnSync.disabled = true;
      syncLoader.style.display = 'inline-block';
      syncText.innerText = 'Sending…';

      try {
        const payload = corpus.map(c => ({
          uuid: c.id,
          name: c.title,
          created_at: c.created_at,
          updated_at: c.updated_at,
          chat_messages: c.messages.map(m => ({
            sender: m.sender === 'user' ? 'human' : 'assistant',
            text: m.text,
            created_at: m.timestamp || null,
          })),
        }));

        const jsonStr = JSON.stringify(payload, null, 2);
        const filename = (chatTitle.value.trim() || 'history').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
        const file = new File([jsonStr], filename, { type: 'application/json' });
        
        log(`Sync payload: ${filename} (${(jsonStr.length / 1024).toFixed(1)} KB)`);

        if (!isOnline) {
          log('Mock sync — server unreachable');
          await new Promise(r => setTimeout(r, 1200));
          log('Mock sync complete');
        } else {
          const form = new FormData();
          form.append('file', file);
          const res = await fetch(`${serverInput.value.trim()}/api/v1/intelligence/ingest`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
          });
          
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`Server error ${res.status}: ${body}`);
          }
          const result = await res.json();
          log(`✓ Synced! AI extracted ${result.decisions?.length} decisions.`);
        }
        showLog();
      } catch (e) {
        log('SYNC FAILED: ' + e.message);
        showLog();
      } finally {
        btnSync.disabled = false;
        syncLoader.style.display = 'none';
        syncText.innerText = 'Send to Chronicle Inbox';
      }
    });
  } catch (globalErr) {
    log('GLOBAL ERROR: ' + globalErr.message);
    showLog();
  }
});
