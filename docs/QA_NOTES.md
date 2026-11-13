# LYMELVA v1 — Browser / PDF Verification Notes

Date: 2026-11-13

Browser: Chromium via Playwright, executable `/usr/bin/chromium`.

**Test harness:** Direct `page.set_content` using site `index.html` plus inlined CSS/JS and inlined local SVG assets, because this execution environment blocks Chromium navigation to `http://127.0.0.1` and `file://` origins. This validates DOM interactions / CSS layout / JS behavior, but does **not** prove live HTTP file delivery, CSP behavior, deployed build or all mobile browsers.

Viewport widths: **320, 390, 768, 1024, 1440 CSS px** (height 900).

- 5/5 widths: `scrollWidth` exactly equals viewport width (no global horizontal overflow).
- 5/5 widths: 6 service cards, 6 knowledge topics, 6 FAQ items, 0 reported JS page errors.
- At 390 and 1440: sun/moon toggle, language switch, service dialog open/Escape close, knowledge filter, FAQ open, client-only form summary.
- At 390: mobile menu open/Escape close.
- Three PDF guide files: generated; 1-page each; Arabic/English rendering reviewed (PyMuPDF image and text extraction).

Artifacts: `desktop-preview.png`, `mobile-preview.png`, `desktop-dark-preview.png`, `mobile-dark-preview.png` and clipped hero previews.

**Not tested:** real devices, production deployed origin, clinical review approval, legal branding clearance, accessibility automation WCAG, connection of appointment/email/WhatsApp providers.

**Extra matrix:** 20/20 Chromium DOM/CSS cases passed at 320/390/768/1024/1440px × Arabic/English × light/dark. Each checked no root overflow, no broken image elements, eight site sections, and no uncaught page JS errors. Tests were run in the embedded-content harness described above; not a substitute for published-origin E2E or WCAG audit.
