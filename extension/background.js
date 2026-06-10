/**
 * Project Chronicle — Background Service Worker (background.js)
 *
 * Acts as a message relay between content.js (which runs inside the AI
 * platform page) and popup.js (which lives in a separate extension context).
 *
 * Flow:
 *   content.js → chrome.runtime.sendMessage({action:'extractProgress', ...})
 *   background.js receives it and forwards to all open extension views.
 *
 * Also stores the latest extraction result in chrome.storage.session so the
 * popup can retrieve it even if it was closed and reopened.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // ── Relay progress updates to popup ──────────────────────────────────────
  if (message.action === 'extractProgress') {
    // Write latest progress into session storage so popup can poll it
    chrome.storage.session.set({ extractProgress: message }).catch(() => {});
    // Also broadcast to any open popup views
    chrome.runtime.sendMessage(message).catch(() => {});
    return false;
  }

  // ── Store completed extraction result ─────────────────────────────────────
  if (message.action === 'extractComplete') {
    chrome.storage.session.set({
      extractResult: message.conversations,
      extractError:  null,
      extractDone:   true
    }).catch(() => {});
    return false;
  }

  // ── Store extraction error ────────────────────────────────────────────────
  if (message.action === 'extractError') {
    chrome.storage.session.set({
      extractResult: null,
      extractError:  message.error,
      extractDone:   true
    }).catch(() => {});
    return false;
  }
});
