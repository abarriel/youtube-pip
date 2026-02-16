// PiP Extension — Background Service Worker (YouTube + Netflix)
"use strict";

// ─── Keyboard shortcut command listener ─────────────────────────
// The commands API provides the active tab context automatically.
// We send a message to the content script on the active YouTube or Netflix tab.
chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-pip") return;

  // chrome.tabs.query with the host_permissions on youtube.com and
  // netflix.com — no "tabs" permission needed.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs?.[0];
    if (!tab?.id || !tab.url) return;

    const isSupported =
      tab.url.includes("youtube.com") || tab.url.includes("netflix.com");
    if (!isSupported) return;

    chrome.tabs.sendMessage(tab.id, { action: "toggle-pip" }).catch(() => {
      // Content script may not be injected yet — ignore silently.
    });
  });
});
