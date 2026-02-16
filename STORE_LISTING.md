# Chrome Web Store — Submission Guide

Everything you need to fill out the Chrome Developer Dashboard.

---

## Product Details

**Name:** YouTube & Netflix PiP

**Summary (manifest description, 132 chars max):**
> Free PiP button for YouTube & Netflix player controls. Pop out video over any app, even outside Chrome.

**Detailed Description (for store listing):**

> YouTube & Netflix PiP adds a native Picture-in-Picture button directly into
> the video player controls bar — right next to fullscreen — on both YouTube
> and Netflix.
>
> Click the button (or press Alt+P) and the video pops out into a floating
> window that stays on top of every application on your screen. Keep watching
> while you code, browse, or work in any other app.
>
> 100% free and open source — no ads, no tracking, no data collection. Ever.
>
> Features:
> - One-click PiP toggle in the YouTube and Netflix player controls
> - Keyboard shortcut (Alt+P) to toggle PiP
> - Auto-PiP: automatically enters Picture-in-Picture when you leave the tab
>   while a video is playing
> - Remembers your preferred PiP window size between sessions
> - Works seamlessly with YouTube's single-page navigation and Netflix's
>   React-based player
> - Minimal permissions — only accesses youtube.com and netflix.com, stores
>   window size locally
>
> The extension uses the browser's native Picture-in-Picture API, so the
> floating video window works across all applications — not just Chrome.
>
> Source code: https://github.com/abarriel/youtube-pip
> Found a bug or have a feature request? Open an issue on GitHub.

**Primary Category:** Productivity (or Entertainment)

**Language:** English

---

## Privacy Tab

### Single Purpose Description

> This extension adds a Picture-in-Picture button to the YouTube and Netflix
> video players so users can pop out the video into a floating window that
> stays on top of all applications.

### Permission Justifications

| Permission | Justification |
|---|---|
| `storage` | Used to save the user's preferred PiP window size (width/height) locally so it persists between browser sessions. No personal data is stored. |
| Host permission: `*://*.youtube.com/*` | Required to inject the PiP button into the YouTube video player controls bar and to interact with the HTML5 video element for Picture-in-Picture functionality. |
| Host permission: `*://*.netflix.com/*` | Required to inject the PiP button into the Netflix video player controls and to interact with the HTML5 video element for Picture-in-Picture functionality. |

### Remote Code

> **Does this extension use remote code?** No.
>
> All code is bundled in the extension package. No external scripts are
> loaded or executed.

### Data Use Disclosures

> **Does this extension collect or use any of the following data types?**
>
> - Personally identifiable information: **No**
> - Health information: **No**
> - Financial and payment information: **No**
> - Authentication information: **No**
> - Personal communications: **No**
> - Location: **No**
> - Web history: **No**
> - User activity: **No**
> - Website content: **No**

### Privacy Policy URL

> Host `PRIVACY.md` as a GitHub page or use the raw URL:
> `https://github.com/abarriel/youtube-pip/blob/main/PRIVACY.md`

---

## Distribution Tab

- **Visibility:** Public
- **Pricing:** Free
- **Regions:** All regions

---

## Store Assets (upload to dashboard)

| Asset | File | Size |
|---|---|---|
| Store icon | `icons/icon128.png` | 128x128 px |
| Small promo tile | `store-assets/promo-small-440x280.png` | 440x280 px |
| Marquee promo tile | `store-assets/promo-marquee-1400x560.png` | 1400x560 px |
| Screenshot | Take a real screenshot (see below) | 1280x800 px |

### Taking a Real Screenshot

The placeholder screenshot is in `store-assets/`, but for the actual
submission you should take a real screenshot:

1. Load the extension in Chrome
2. Go to a YouTube or Netflix video
3. Hover over the player so the controls bar is visible
4. Take a 1280x800 screenshot showing the PiP button in the controls
5. Optionally take a second screenshot showing the PiP window floating
   over another application

Save screenshots to `store-assets/` and upload them in the dashboard.

---

## Build the ZIP

Run the build script to create the submission ZIP:

```bash
./build.sh
```

This creates `youtube-pip.zip` containing only the files needed for the
extension (no store assets, docs, or git files).

---

## Submission Checklist

- [ ] Google Developer account created ($5 one-time fee)
- [ ] 2-Step Verification enabled on Google account
- [ ] ZIP uploaded via [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [ ] Store icon uploaded (128x128)
- [ ] At least 1 real screenshot uploaded (1280x800)
- [ ] Small promo tile uploaded (440x280)
- [ ] Detailed description filled in
- [ ] Category selected
- [ ] Privacy tab completed (single purpose, permissions, data disclosures)
- [ ] Privacy policy URL provided
- [ ] Distribution preferences set
- [ ] Submitted for review
