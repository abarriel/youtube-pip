// PiP Extension — Content Script (YouTube + Netflix)
(() => {
  "use strict";

  const PIP_BUTTON_ID = "pip-ext-button-custom";
  const STORAGE_KEY = "pip_window_size";

  // ─── i18n helper ──────────────────────────────────────────────
  const i18n = (key) => chrome.i18n.getMessage(key) || key;

  // ─── State ────────────────────────────────────────────────────
  let pipActive = false;
  let autoPipEnabled = true;

  // ─── Site detection ───────────────────────────────────────────
  const SITE_YOUTUBE = "youtube";
  const SITE_NETFLIX = "netflix";
  const SITE_UNKNOWN = "unknown";

  function detectSite() {
    const host = location.hostname;
    if (host.includes("youtube.com")) return SITE_YOUTUBE;
    if (host.includes("netflix.com")) return SITE_NETFLIX;
    return SITE_UNKNOWN;
  }

  const currentSite = detectSite();

  // ─── SVG Builder (Trusted Types safe — no innerHTML) ──────────
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

  // ─── Helpers ──────────────────────────────────────────────────
  function getVideo() {
    if (currentSite === SITE_YOUTUBE) {
      return (
        document.querySelector("video.html5-main-video") ||
        document.querySelector("video")
      );
    }
    if (currentSite === SITE_NETFLIX) {
      return document.querySelector("video");
    }
    return document.querySelector("video");
  }

  // ─── Site-specific: get the container to insert the PiP button ─
  function getInsertionTarget() {
    if (currentSite === SITE_YOUTUBE) {
      // YouTube 2024+ has nested controls; fall back to flat layout
      return (
        document.querySelector(".ytp-right-controls-right") ||
        document.querySelector(".ytp-right-controls")
      );
    }
    if (currentSite === SITE_NETFLIX) {
      // Netflix player button row — try multiple selectors as Netflix
      // changes their class names frequently
      return (
        document.querySelector("[data-uia='controls-standard']") ||
        document.querySelector(".PlayerControlsNeo__button-control-row") ||
        document.querySelector(".watch-video--bottom-controls-container")
      );
    }
    return null;
  }

  // ─── Site-specific: find the reference button to insert before ─
  function getInsertionReference(container) {
    if (currentSite === SITE_YOUTUBE) {
      const fsBtn = container.querySelector(".ytp-fullscreen-button");
      if (fsBtn && fsBtn.parentNode === container) return fsBtn;
      return null;
    }
    if (currentSite === SITE_NETFLIX) {
      // Insert before the fullscreen button on Netflix
      const fsBtn =
        container.querySelector("[data-uia='control-fullscreen-enter']") ||
        container.querySelector("[data-uia='control-fullscreen-exit']");
      if (fsBtn) return fsBtn;
      return null;
    }
    return null;
  }

  // ─── Save / Restore PiP window size ───────────────────────────
  function savePipSize(pipWindow) {
    if (!pipWindow) return;
    try {
      const size = { width: pipWindow.width, height: pipWindow.height };
      chrome.storage.local.set({ [STORAGE_KEY]: size });
    } catch (_) {
      // storage may be unavailable
    }
  }

  // ─── Toggle PiP ──────────────────────────────────────────────
  async function togglePip() {
    const video = getVideo();
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("[PiP Extension]", err.message);
    }
  }

  // ─── Update button visual state ───────────────────────────────
  function updateButtonState() {
    const btn = document.getElementById(PIP_BUTTON_ID);
    if (!btn) return;

    const tooltip = btn.querySelector(".pip-ext-tooltip");
    const iconContainer = btn.querySelector(".pip-ext-icon");

    if (pipActive) {
      btn.classList.add("pip-ext-active");
      if (tooltip) tooltip.textContent = i18n("tooltipExit");
      if (iconContainer) {
        iconContainer.replaceChildren(createPipExitIcon());
      }
    } else {
      btn.classList.remove("pip-ext-active");
      if (tooltip) tooltip.textContent = i18n("tooltipEnter");
      if (iconContainer) {
        iconContainer.replaceChildren(createPipIcon());
      }
    }
  }

  // ─── PiP event listeners ─────────────────────────────────────
  function attachVideoListeners(video) {
    if (video.__pipExtListenersAttached) return;
    video.__pipExtListenersAttached = true;

    video.addEventListener("enterpictureinpicture", (e) => {
      pipActive = true;
      updateButtonState();

      const pipWindow = e.pictureInPictureWindow;
      if (pipWindow) {
        pipWindow.addEventListener("resize", () => savePipSize(pipWindow));
        savePipSize(pipWindow);
      }
    });

    video.addEventListener("leavepictureinpicture", () => {
      pipActive = false;
      updateButtonState();
    });
  }

  // ─── Site-specific button class names ─────────────────────────
  function getButtonClasses() {
    if (currentSite === SITE_YOUTUBE) {
      return "pip-ext-button ytp-button";
    }
    if (currentSite === SITE_NETFLIX) {
      return "pip-ext-button pip-ext-netflix";
    }
    return "pip-ext-button";
  }

  // ─── Create and inject the PiP button ─────────────────────────
  function injectButton() {
    // Already injected?
    if (document.getElementById(PIP_BUTTON_ID)) return;

    const container = getInsertionTarget();
    if (!container) return;

    const btn = document.createElement("button");
    btn.id = PIP_BUTTON_ID;
    btn.className = getButtonClasses();
    btn.setAttribute("aria-label", i18n("ariaLabel"));
    btn.setAttribute("title", "");

    // Tooltip span
    const tooltip = document.createElement("span");
    tooltip.className = "pip-ext-tooltip";
    tooltip.textContent = i18n("tooltipEnter");
    btn.appendChild(tooltip);

    // Icon wrapper
    const iconWrap = document.createElement("span");
    iconWrap.className = "pip-ext-icon";
    iconWrap.appendChild(createPipIcon());
    btn.appendChild(iconWrap);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePip();
    });

    // Insert at the right place in the controls bar
    const ref = getInsertionReference(container);
    if (ref) {
      container.insertBefore(btn, ref);
    } else {
      // Netflix: append at end; YouTube: prepend
      if (currentSite === SITE_NETFLIX) {
        container.appendChild(btn);
      } else {
        container.prepend(btn);
      }
    }

    // Attach listeners to the video
    const video = getVideo();
    if (video) {
      attachVideoListeners(video);
      pipActive = !!document.pictureInPictureElement;
      updateButtonState();
    }
  }

  // ─── Auto-PiP on visibility change ────────────────────────────
  function handleVisibilityChange() {
    if (!autoPipEnabled) return;
    const video = getVideo();
    if (!video) return;

    if (document.visibilityState === "hidden") {
      if (!video.paused && !document.pictureInPictureElement) {
        video.requestPictureInPicture().catch(() => {
          // Silently fail — user gesture may be required
        });
      }
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // ─── Message listener (from background.js) ────────────────────
  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === "toggle-pip") {
      togglePip();
      sendResponse({ ok: true });
    } else if (request.action === "set-auto-pip") {
      autoPipEnabled = request.enabled;
      sendResponse({ ok: true });
    }
    return true;
  });

  // ─── Observer: re-inject button on SPA navigation ─────────────
  function setupObserver() {
    if (currentSite === SITE_YOUTUBE) {
      // YouTube fires this custom event on SPA navigation
      document.addEventListener("yt-navigate-finish", () => {
        setTimeout(injectButton, 500);
      });
    }

    // Universal MutationObserver for both sites
    // Netflix is a React SPA that re-renders controls frequently,
    // YouTube also re-renders on navigation
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

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    if (currentSite === SITE_UNKNOWN) return;

    injectButton();
    setupObserver();

    // Retry a few times in case the player loads slowly
    const retries = [1000, 2000, 4000, 8000];
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
