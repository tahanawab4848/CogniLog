/**
 * Project Chronicle — Background Service Worker
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extractProgress') {
    chrome.storage.session.set({ extractProgress: message }).catch(() => {});
    chrome.runtime.sendMessage(message).catch(() => {});
    return false;
  }
  
  if (message.action === 'startBackgroundSync') {
    startBackgroundSync(message);
    return false;
  }

  if (message.action === 'extractComplete') {
    handleExtractComplete(message.conversations);
    return false;
  }

  if (message.action === 'extractError') {
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.runtime.sendMessage({ action: 'syncError', error: message.error }).catch(() => {});
    return false;
  }
});

async function startBackgroundSync(opts) {
  const { tabId, platform, limit, serverUrl } = opts;
  const baseUrl = serverUrl.replace(/\/+$/, '');
  
  try {
    chrome.action.setBadgeText({ text: 'SYNC' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });
    
    // 1. Get auth token
    const stored = await chrome.storage.local.get('chronicle_token');
    const token = stored.chronicle_token;
    if (!token) throw new Error("Not logged in");

    // 2. Fetch locally stored sync IDs (Deduplication)
    const syncedIds = stored.synced_chat_ids || [];

    // Save context globally for the 'extractComplete' listener
    await chrome.storage.session.set({ syncContext: { platform, baseUrl, token } });

    // 3. Command extraction
    chrome.tabs.sendMessage(tabId, { action: 'extractAllHistory', limit, syncedIds }, (response) => {
      if (chrome.runtime.lastError) {
        // Tab closed or content script not injected
        chrome.action.setBadgeText({ text: 'ERR' });
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
        chrome.runtime.sendMessage({ action: 'syncError', error: 'Content script disconnected. Please REFRESH the ChatGPT/Claude page and try again.' }).catch(() => {});
      }
    });
  } catch(e) {
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.runtime.sendMessage({ action: 'syncError', error: e.message }).catch(() => {});
  }
}

async function handleExtractComplete(corpus) {
  try {
    const session = await chrome.storage.session.get('syncContext');
    const ctx = session.syncContext;
    if (!ctx) throw new Error("Missing sync context");

    const { platform, baseUrl, token, since } = ctx;

    if (!corpus || !corpus.length) {
      chrome.action.setBadgeText({ text: 'OK' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
      return;
    }

    // 4. Chunk & Upload
    const chunkSize = 25;
    let latestUpdated = since ? new Date(since) : new Date(0);

    for (let i = 0; i < corpus.length; i += chunkSize) {
      const chunk = corpus.slice(i, i + chunkSize);
      const payload = chunk.map(c => ({
        uuid: c.id, name: c.title, created_at: c.created_at, updated_at: c.updated_at,
        chat_messages: c.messages.map(m => ({
          sender: m.sender === 'user' ? 'human' : 'assistant',
          text: m.text, created_at: m.timestamp || null,
        })),
      }));

      for (const c of chunk) {
        if (c.updated_at && new Date(c.updated_at) > latestUpdated) {
          latestUpdated = new Date(c.updated_at);
        }
      }

      const jsonStr = JSON.stringify(payload);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const form = new FormData(); 
      form.append('file', blob, `sync_chunk_${i}.json`);
      
      const res = await fetch(`${baseUrl}/api/v1/intelligence/ingest?project_id=inbox`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }

    // 5. Update Local Sync State
    const allIds = corpus.map(c => c.id);
    const stored = await chrome.storage.local.get('synced_chat_ids');
    const existing = stored.synced_chat_ids || [];
    await chrome.storage.local.set({ synced_chat_ids: [...new Set([...existing, ...allIds])] });

    chrome.action.setBadgeText({ text: 'OK' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    
    // Notify popup if still open
    chrome.runtime.sendMessage({ action: 'syncComplete' }).catch(() => {});
  } catch(e) {
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
    chrome.runtime.sendMessage({ action: 'syncError', error: e.message }).catch(() => {});
  }
}
