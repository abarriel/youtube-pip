// YouTube PiP Extension — Background Service Worker
"use strict";

// ─── Keyboard shortcut command listener ─────────────────────────
// The commands API provides the active tab context automatically.
// We send a message to the content script on the active YouTube tab.
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-pip") return;

  // chrome.tabs.query with the activeTab-like behavior granted by
  // host_permissions on youtube.com — no "tabs" permission needed.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.id || !tab.url?.includes("youtube.com")) return;

    chrome.tabs.sendMessage(tab.id, { action: "toggle-pip" }).catch(() => {
      // Content script may not be injected yet — ignore silently.
    });
  });
});
