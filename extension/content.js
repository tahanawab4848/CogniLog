/**
 * Project Chronicle — Content Script (content.js)
 *
 * Runs inside ChatGPT / Claude / Gemini tab context.
 * Uses the platform's own internal authenticated REST API (same session cookies)
 * to extract the complete conversation history, then returns it to the popup
 * via chrome.runtime.sendMessage + the background service worker relay.
 */

// ─── Utility ─────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function reportProgress(stage, fetched, total) {
  chrome.runtime.sendMessage({
    action: 'extractProgress',
    stage, fetched, total
  }).catch(() => {});
}

// ─── ChatGPT Extractor ────────────────────────────────────────────────────────
async function extractChatGPT(fetchLimit = 999999, syncedIds = new Set()) {
  const ALL = [];
  let offset = 0;
  const LIMIT = 28;

  reportProgress('listing', 0, '?');

  let accessToken = '';
  try {
    const sessionRes = await fetch('https://chatgpt.com/api/auth/session', { credentials: 'include' });
    const sessionData = await sessionRes.json();
    accessToken = sessionData.accessToken || '';
  } catch(e) {}

  const headers = accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {};

  let serverTotal = 999999;

  while (ALL.length < fetchLimit && offset < serverTotal) {
    const res = await fetch(
      `https://chatgpt.com/backend-api/conversations?offset=${offset}&limit=${LIMIT}&order=updated`,
      { credentials: 'include', headers }
    );
    if (!res.ok) throw new Error(`ChatGPT API error ${res.status} — make sure you are logged in to ChatGPT.`);
    const data = await res.json();

    serverTotal = data.total || 999999;
    const items = Array.isArray(data) ? data : (data.items || []);
    if (!items.length) break;

    const displayTotal = Math.min(serverTotal, fetchLimit);

    for (const item of items) {
      if (ALL.length >= fetchLimit) break;
      
      // Skip if already exported
      if (syncedIds.has(item.id)) continue;
      try {
        const cRes = await fetch(
          `https://chatgpt.com/backend-api/conversation/${item.id}`,
          { credentials: 'include', headers }
        );
        if (!cRes.ok) continue;
        const conv = await cRes.json();
        const messages = flattenChatGPTMapping(conv.mapping || {});
        ALL.push({
          id:         item.id,
          title:      item.title || 'Untitled',
          created_at: item.create_time  ? new Date(typeof item.create_time === 'number' ? item.create_time * 1000 : item.create_time).toISOString() : null,
          updated_at: item.update_time  ? new Date(typeof item.update_time === 'number' ? item.update_time * 1000 : item.update_time).toISOString() : null,
          messages
        });
      } catch { /* skip failed individual convo */ }
      reportProgress('fetching', ALL.length, displayTotal);
      await sleep(80);
    }
    if (ALL.length >= fetchLimit) break;
    offset += items.length;
    if (items.length < LIMIT) break;
  }

  return ALL;
}

function flattenChatGPTMapping(mapping) {
  // Find root (no parent or parent not in mapping)
  let rootId = null;
  for (const [id, node] of Object.entries(mapping)) {
    if (!node.parent || !mapping[node.parent]) { rootId = id; break; }
  }
  if (!rootId) return [];

  const messages = [];
  const visited  = new Set();

  function walk(id) {
    if (!id || visited.has(id)) return;
    visited.add(id);
    const node = mapping[id];
    if (!node) return;
    const msg = node.message;
    if (msg?.content) {
      const role = msg.author?.role;
      if (role === 'user' || role === 'assistant') {
        const text = (msg.content.parts || [])
          .map(p => typeof p === 'string' ? p : JSON.stringify(p))
          .join('').trim();
        if (text) {
          messages.push({
            sender:    role,
            text,
            timestamp: msg.create_time ? new Date(typeof msg.create_time === 'number' ? msg.create_time * 1000 : msg.create_time).toISOString() : null
          });
        }
      }
    }
    (node.children || []).forEach(walk);
  }

  walk(rootId);
  return messages;
}

// ─── Claude Extractor ─────────────────────────────────────────────────────────
async function extractClaude(fetchLimit = 999999, syncedIds = new Set()) {
  const ALL = [];

  reportProgress('listing', 0, '?');

  // Step 1: get organisation UUID
  let orgId = null;

  // Try /api/auth/current_account first
  try {
    const r = await fetch('https://claude.ai/api/auth/current_account', { credentials: 'include' });
    if (r.ok) {
      const body = await r.json();
      orgId = body?.account?.memberships?.[0]?.organization?.uuid
           || body?.memberships?.[0]?.organization?.uuid;
    }
  } catch { /* try next */ }

  // Fallback: /api/organizations (list endpoint)
  if (!orgId) {
    try {
      const r = await fetch('https://claude.ai/api/organizations', { credentials: 'include' });
      if (r.ok) {
        const orgs = await r.json();
        orgId = orgs?.[0]?.uuid || orgs?.[0]?.id;
      }
    } catch { /* try next */ }
  }

  // Final fallback: parse from the page's __NEXT_DATA__ or window state
  if (!orgId) {
    try {
      const nd = document.getElementById('__NEXT_DATA__');
      if (nd) {
        const parsed = JSON.parse(nd.textContent);
        orgId = parsed?.props?.pageProps?.currentOrganization?.uuid;
      }
    } catch { /* give up */ }
  }

  if (!orgId) throw new Error('Could not find your Claude organisation ID. Make sure you are logged in at claude.ai.');

  // Step 2: list conversations
  const listUrl = `https://claude.ai/api/organizations/${orgId}/chat_conversations?limit=1000&sort=updated`;
  const listRes = await fetch(listUrl, { credentials: 'include' });
  if (!listRes.ok) throw new Error(`Claude conversation list API returned ${listRes.status}. Make sure you are on claude.ai and logged in.`);

  let convList = await listRes.json();
  // API may return {conversations:[]} or directly an array
  if (!Array.isArray(convList)) convList = convList.conversations || convList.data || [];

  const total = Math.min(convList.length, fetchLimit);
  let fetched = 0;

  // Step 3: fetch each conversation's messages
  for (const conv of convList) {
    if (ALL.length >= fetchLimit) break;
    
    const convId = conv.uuid || conv.id;
    if (syncedIds.has(convId)) continue;
    try {
      const cRes = await fetch(
        `https://claude.ai/api/organizations/${orgId}/chat_conversations/${convId}?tree=true&render_all_tools=true`,
        { credentials: 'include' }
      );
      if (!cRes.ok) continue;
      const cData = await cRes.json();

      const messages = (cData.chat_messages || [])
        .map(m => ({
          sender:    m.sender === 'human' ? 'user' : 'assistant',
          text:      extractClaudeText(m),
          timestamp: m.created_at || null
        }))
        .filter(m => m.text.trim().length > 0);

      ALL.push({
        id:         convId,
        title:      conv.name || 'Untitled',
        created_at: conv.created_at || null,
        updated_at: conv.updated_at || null,
        messages
      });
    } catch { /* skip failed convos */ }

    fetched++;
    reportProgress('fetching', fetched, total);
    await sleep(60);
  }

  return ALL;
}

function extractClaudeText(m) {
  if (typeof m.text === 'string' && m.text) return m.text;
  if (Array.isArray(m.content)) {
    return m.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  }
  return '';
}

// ─── Gemini Extractor (DOM-based) ─────────────────────────────────────────────
async function extractGemini() {
  reportProgress('fetching', 0, 1);

  const title = document.querySelector('h1,h2')?.innerText?.trim()
             || document.title
             || 'Gemini Session';

  const selectors = [
    'user-query', 'model-response',
    '.user-query-text-lines', '.model-response-text',
    '[class*="user_query"]', '[class*="model_response"]',
    '[data-role="user"]',    '[data-role="model"]'
  ];

  const messages = [];
  document.querySelectorAll(selectors.join(',')).forEach(el => {
    const text = el.innerText?.trim();
    if (!text || text.length < 2) return;
    const tag = el.tagName.toLowerCase();
    const cls = (el.className || '').toString().toLowerCase();
    const sender = (tag === 'user-query' || cls.includes('user') || el.dataset?.role === 'user')
      ? 'user' : 'assistant';
    messages.push({ sender, text, timestamp: null });
  });

  if (!messages.length) throw new Error('No Gemini messages found. Open a specific conversation, scroll to load all messages, then try again.');

  return [{ id: 'gemini-' + Date.now(), title, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages }];
}

// ─── Message listener ─────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {

  if (request.action === 'extractAllHistory') {
    const fetchLimit = request.limit || 999999;
    const syncedIds = new Set(request.syncedIds || []);
    const url = window.location.href;
    let extractor;
    if (url.includes('chatgpt.com'))        extractor = extractChatGPT(fetchLimit, syncedIds);
    else if (url.includes('claude.ai'))     extractor = extractClaude(fetchLimit, syncedIds);
    else if (url.includes('gemini.google')) extractor = extractGemini();
    else {
      sendResponse({ success: false, error: 'Please navigate to ChatGPT, Claude, or Gemini first.' });
      return true;
    }

    extractor
      .then(conversations => {
        chrome.runtime.sendMessage({ action: 'extractComplete', conversations }).catch(() => {});
        sendResponse({ success: true, conversations });
      })
      .catch(err => {
        chrome.runtime.sendMessage({ action: 'extractError', error: err.message }).catch(() => {});
        sendResponse({ success: false, error: err.message });
      });

    return true; // keep channel open
  }

  // Quick single-page DOM scrape (legacy fallback)
  if (request.action === 'scrapeActiveChat') {
    try {
      const url = window.location.href;
      const messages = [];
      const title = document.title;
      if (url.includes('chatgpt.com')) {
        document.querySelectorAll('div[data-message-author-role]').forEach(n => {
          const role = n.getAttribute('data-message-author-role');
          const text = (n.querySelector('.markdown') || n).innerText.trim();
          if (text) messages.push({ sender: role === 'user' ? 'user' : 'assistant', text });
        });
      }
      sendResponse({ success: true, data: { title, url, messages, timestamp: new Date().toISOString() } });
    } catch (e) {
      sendResponse({ success: false, error: e.message });
    }
    return true;
  }
});
