// PiP Extension — Netflix content script
(() => {
  "use strict";

  const BUTTON_ID = PipExt.BUTTON_ID;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PIP_PATH_ENTER =
    "M19 11h-8v6h8v-6zm4 10V3H1v18h22zm-2-1.98H3V4.97h18v14.05z";
  const PIP_PATH_EXIT =
    "M21 3H3v18h18V3zm-2 16H5V5h14v14zm-4-8H9v6h6v-6z";

  function getVideo() {
    return document.querySelector("video");
  }

  function stripDisablePiP() {
    const video = getVideo();
    if (!video) return;
    video.removeAttribute("disablepictureinpicture");
    video.disablePictureInPicture = false;
  }

  // ─── Clone the exact Netflix native button structure ───────────
  // Native structure (captured from live DOM):
  //   <div class="default-ltr-…-1npqywr" style="min-width:3rem;width:3rem"></div>   ← spacer
  //   <div class="medium default-ltr-…-1dcjcj4">                                    ← wrapper
  //     <button aria-label="…" class=" default-ltr-…-1enhvti">
  //       <div class="control-medium default-ltr-…-iyulz3" role="presentation">
  //         <svg viewBox="0 0 24 24" width="24" height="24" fill="none" role="img">
  //           <path fill="currentColor" fill-rule="evenodd" d="…" clip-rule="evenodd"/>
  //         </svg>
  //       </div>
  //     </button>
  //   </div>
  //
  // We clone a real sibling button to inherit the exact dynamic class names,
  // then replace the SVG path and aria-label.

  function cloneNativeButton(refButton) {
    const wrapper = refButton.parentElement.cloneNode(true);
    const btn = wrapper.querySelector("button");
    const svg = wrapper.querySelector("svg");
    const path = wrapper.querySelector("path");

    btn.setAttribute("aria-label", PipExt.i18n("ariaLabel"));
    btn.removeAttribute("data-uia");
    btn.id = BUTTON_ID;

    svg.removeAttribute("data-icon");
    svg.removeAttribute("data-icon-id");
    svg.removeAttribute("data-uia");

    path.setAttribute("d", PIP_PATH_ENTER);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      stripDisablePiP();
      PipExt.toggle(getVideo());
    });

    return wrapper;
  }

  function cloneNativeSpacer(refButton) {
    const wrapper = refButton.parentElement;
    const spacer = wrapper.previousElementSibling;
    if (spacer && !spacer.querySelector("button")) {
      return spacer.cloneNode(true);
    }
    // Fallback: create a spacer manually
    const div = document.createElement("div");
    div.style.cssText = "min-width: 3rem; width: 3rem;";
    return div;
  }

  // ─── Update button icon when PiP state changes ────────────────
  function updateIcon() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn) return;
    const path = btn.querySelector("path");
    if (!path) return;
    path.setAttribute(
      "d",
      PipExt.active ? PIP_PATH_EXIT : PIP_PATH_ENTER
    );
  }

  // ─── Find the button row and fullscreen reference ─────────────
  function findFullscreenButton() {
    return (
      document.querySelector("[data-uia='control-fullscreen-enter']") ||
      document.querySelector("[data-uia='control-fullscreen-exit']")
    );
  }

  function findButtonRow(fsBtn) {
    if (!fsBtn) return null;
    const row = fsBtn.parentElement?.parentElement;
    return row && row.children.length > 3 ? row : null;
  }

  function findRowRef(row, fsBtn) {
    let el = fsBtn;
    while (el && el.parentElement !== row) el = el.parentElement;
    return el;
  }

  // ─── Inject ───────────────────────────────────────────────────
  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;

    const fsBtn = findFullscreenButton();
    if (!fsBtn) return;

    const row = findButtonRow(fsBtn);
    if (!row) return;

    const wrapper = cloneNativeButton(fsBtn);
    const spacer = cloneNativeSpacer(fsBtn);
    const ref = findRowRef(row, fsBtn);

    if (ref) {
      row.insertBefore(spacer, ref);
      row.insertBefore(wrapper, ref);
    } else {
      row.appendChild(spacer);
      row.appendChild(wrapper);
    }

    stripDisablePiP();
    const video = getVideo();
    if (video) {
      PipExt.attachListeners(video);
      PipExt.active = !!document.pictureInPictureElement;
      updateIcon();
    }
  }

  // ─── Observer ─────────────────────────────────────────────────
  function setupObserver() {
    const observer = new MutationObserver(() => {
      stripDisablePiP();
      if (!document.getElementById(BUTTON_ID)) injectButton();
      const video = getVideo();
      if (video) PipExt.attachListeners(video);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Override PipExt.updateButton for Netflix ─────────────────
  // The shared updateButton uses pip-ext-icon spans.
  // On Netflix we cloned native elements, so we override.
  const _origUpdate = PipExt.updateButton;
  PipExt.updateButton = function () {
    updateIcon();
  };

  // ─── Init ─────────────────────────────────────────────────────
  function init() {
    stripDisablePiP();
    PipExt.setupAutoPip(getVideo);
    PipExt.setupMessageListener(getVideo, stripDisablePiP);
    injectButton();
    setupObserver();

    for (const delay of [1000, 2000, 4000]) {
      setTimeout(() => {
        stripDisablePiP();
        if (!document.getElementById(BUTTON_ID)) injectButton();
      }, delay);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
