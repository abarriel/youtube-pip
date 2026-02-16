// YouTube PiP Extension — Content Script
(() => {
  "use strict";

  const PIP_BUTTON_ID = "ytp-pip-button-custom";
  const STORAGE_KEY = "ytpip_window_size";

  // ─── State ──────────────────────────────────────────────────────
  let pipActive = false;
  let autoPipEnabled = true;

  // ─── SVG Builder (Trusted Types safe — no innerHTML) ───────────
  const SVG_NS = "http://www.w3.org/2000/svg";

  function createPipIcon() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("height", "100%");
    svg.setAttribute("width", "100%");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M19 11h-8v6h8v-6zm4 10V3H1v18h22zm-2-1.98H3V4.97h18v14.05z"
    );
    svg.appendChild(path);
    return svg;
  }

  function createPipExitIcon() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("height", "100%");
    svg.setAttribute("width", "100%");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute(
      "d",
      "M21 3H3v18h18V3zm-2 16H5V5h14v14zm-4-8H9v6h6v-6z"
    );
    svg.appendChild(path);
    return svg;
  }

  // ─── Helpers ────────────────────────────────────────────────────
  function getVideo() {
    return (
      document.querySelector("video.html5-main-video") ||
      document.querySelector("video")
    );
  }

  /**
   * YouTube player controls have evolved over time.
   * Current layout (2024+):
   *   .ytp-right-controls
   *     .ytp-right-controls-left   (autonav, subtitles, settings)
   *     .ytp-right-controls-right  (size, remote, fullscreen)
   *
   * We insert our button in .ytp-right-controls-right before fullscreen,
   * or fall back to .ytp-right-controls directly for older layouts.
   */
  function getInsertionTarget() {
    // Try the new nested layout first
    const rightRight = document.querySelector(".ytp-right-controls-right");
    if (rightRight) return rightRight;
    // Fall back to the classic flat layout
    return document.querySelector(".ytp-right-controls");
  }

  // ─── Save / Restore PiP window size ────────────────────────────
  function savePipSize(pipWindow) {
    if (!pipWindow) return;
    try {
      const size = { width: pipWindow.width, height: pipWindow.height };
      chrome.storage.local.set({ [STORAGE_KEY]: size });
    } catch (_) {
      // storage may be unavailable
    }
  }

  async function getSavedSize() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      return result[STORAGE_KEY] || null;
    } catch (_) {
      return null;
    }
  }

  // ─── Toggle PiP ────────────────────────────────────────────────
  async function togglePip() {
    const video = getVideo();
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        if (document.pictureInPictureEnabled) {
          await video.requestPictureInPicture();
        }
      }
    } catch (err) {
      console.warn("[YouTube PiP]", err.message);
    }
  }

  // ─── Update button visual state ────────────────────────────────
  function updateButtonState() {
    const btn = document.getElementById(PIP_BUTTON_ID);
    if (!btn) return;

    const tooltip = btn.querySelector(".ytp-pip-tooltip");
    const iconContainer = btn.querySelector(".ytp-pip-icon");

    if (pipActive) {
      btn.classList.add("ytp-pip-active");
      if (tooltip) tooltip.textContent = "Exit PiP (Alt+P)";
      if (iconContainer) {
        iconContainer.replaceChildren(createPipExitIcon());
      }
    } else {
      btn.classList.remove("ytp-pip-active");
      if (tooltip) tooltip.textContent = "Picture-in-Picture (Alt+P)";
      if (iconContainer) {
        iconContainer.replaceChildren(createPipIcon());
      }
    }
  }

  // ─── PiP event listeners ───────────────────────────────────────
  function attachVideoListeners(video) {
    if (video.__ytpipListenersAttached) return;
    video.__ytpipListenersAttached = true;

    video.addEventListener("enterpictureinpicture", (e) => {
      pipActive = true;
      updateButtonState();

      const pipWindow = e.pictureInPictureWindow;
      if (pipWindow) {
        // Save size on resize
        pipWindow.addEventListener("resize", () => savePipSize(pipWindow));
        // Save initial size
        savePipSize(pipWindow);
      }
    });

    video.addEventListener("leavepictureinpicture", () => {
      pipActive = false;
      updateButtonState();
    });
  }

  // ─── Create and inject the PiP button ──────────────────────────
  function injectButton() {
    // Already injected?
    if (document.getElementById(PIP_BUTTON_ID)) return;

    const container = getInsertionTarget();
    if (!container) return;

    const btn = document.createElement("button");
    btn.id = PIP_BUTTON_ID;
    btn.className = "ytp-pip-button ytp-button";
    btn.setAttribute("aria-label", "Picture-in-Picture");
    btn.setAttribute("title", "");
    btn.setAttribute("data-tooltip-target-id", "ytp-pip-button-custom");

    // Tooltip span
    const tooltip = document.createElement("span");
    tooltip.className = "ytp-pip-tooltip";
    tooltip.textContent = "Picture-in-Picture (Alt+P)";
    btn.appendChild(tooltip);

    // Icon wrapper
    const iconWrap = document.createElement("span");
    iconWrap.className = "ytp-pip-icon";
    iconWrap.appendChild(createPipIcon());
    btn.appendChild(iconWrap);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePip();
    });

    // Insert before the fullscreen button within the same container
    const fullscreenBtn = container.querySelector(".ytp-fullscreen-button");
    if (fullscreenBtn && fullscreenBtn.parentNode === container) {
      container.insertBefore(btn, fullscreenBtn);
    } else {
      // Fallback: append at the beginning
      container.prepend(btn);
    }

    // Attach listeners to the video
    const video = getVideo();
    if (video) {
      attachVideoListeners(video);
      // Sync initial state
      pipActive = !!document.pictureInPictureElement;
      updateButtonState();
    }
  }

  // ─── Auto-PiP on visibility change ─────────────────────────────
  function handleVisibilityChange() {
    if (!autoPipEnabled) return;
    const video = getVideo();
    if (!video) return;

    if (document.visibilityState === "hidden") {
      // Only auto-pip if the video is playing
      if (!video.paused && !document.pictureInPictureElement) {
        video.requestPictureInPicture().catch(() => {
          // Silently fail — user gesture may be required
        });
      }
    }
    // Note: we do NOT auto-exit PiP when returning, so user can keep watching
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // ─── Message listener (from background.js) ─────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === "toggle-pip") {
      togglePip();
      sendResponse({ ok: true });
    } else if (msg.action === "set-auto-pip") {
      autoPipEnabled = msg.enabled;
      sendResponse({ ok: true });
    }
    return true;
  });

  // ─── Observer: re-inject button on YouTube SPA navigation ──────
  function setupObserver() {
    // YouTube fires this custom event on SPA navigation
    document.addEventListener("yt-navigate-finish", () => {
      // Small delay to let the player DOM render
      setTimeout(injectButton, 500);
    });

    // Also watch for DOM changes (player might re-render)
    const observer = new MutationObserver(() => {
      if (!document.getElementById(PIP_BUTTON_ID) && getInsertionTarget()) {
        injectButton();
      }
      // Re-attach video listeners if video element changed
      const video = getVideo();
      if (video) attachVideoListeners(video);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // ─── Init ───────────────────────────────────────────────────────
  function init() {
    injectButton();
    setupObserver();

    // Retry a few times in case the player loads slowly
    const retries = [1000, 2000, 4000];
    retries.forEach((delay) => {
      setTimeout(() => {
        if (!document.getElementById(PIP_BUTTON_ID)) {
          injectButton();
        }
      }, delay);
    });
  }

  // Start when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
