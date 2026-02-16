// YouTube PiP Extension — Background Service Worker
"use strict";

// ─── Keyboard shortcut command listener ─────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "toggle-pip") {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab && tab.url && tab.url.includes("youtube.com")) {
        chrome.tabs.sendMessage(tab.id, { action: "toggle-pip" }).catch(() => {
          // Content script may not be injected yet
        });
      }
    } catch (err) {
      console.warn("[YouTube PiP] Command error:", err.message);
    }
  }
});

// ─── Auto-PiP: detect when user leaves a YouTube tab ────────────
// When the user switches tabs, notify the YouTube content script
// so it can trigger PiP if a video is playing.

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    // Get all YouTube tabs that are NOT the newly active tab
    const ytTabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });

    for (const tab of ytTabs) {
      if (tab.id !== activeInfo.tabId) {
        // The user just left this YouTube tab — the content script's
        // visibilitychange handler will pick this up automatically.
        // No message needed; the browser fires visibilitychange.
      }
    }
  } catch (_) {
    // Ignore errors from tabs that have been closed
  }
});

// When Chrome loses focus entirely (user switches to another app),
// all tabs get visibilityState = "hidden", so the content script's
// visibilitychange listener handles this automatically.

chrome.windows.onFocusChanged.addListener((windowId) => {
  // windowId === chrome.windows.WINDOW_ID_NONE means Chrome lost focus.
  // The content script handles this via visibilitychange — no action needed here.
  // This listener is kept as a placeholder for future enhancements.
});
