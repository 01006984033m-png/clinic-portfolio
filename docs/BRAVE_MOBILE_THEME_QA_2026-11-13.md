# LYMELVA — Brave mobile theme and floating CTA fix
Date: 2026-11-13

## User-provided evidence
Android Brave screenshot shows darkened site content while the theme switch displays the sun/light state. This is consistent with browser-forced auto-darkening, although browser Night Mode settings cannot be verified remotely. The floating WhatsApp bar also obscures the clinical hero photo.

## Changes
- Add CSS `color-scheme: only light` for the selected light mode; preserve explicit dark mode and brand colors.
- Mirror the chosen scheme in JS and expose the current theme in the toggle title/data attribute.
- Make mobile hero copy denser without changing the desktop composition.
- Collapse the mobile floating WhatsApp CTA to a 50px accessible phone icon and hide it at the top of the page, since the hero already contains a WhatsApp CTA. Reappear after scrolling.
- Retain the exact official contact URL `https://wa.me/201027594048` and patient education CTA.

## Verification
Headless Chromium with source HTML/CSS/JS and inlined image assets (sandbox blocks localhost and file URL navigation): five viewports 320, 390, 430, 768, 1440 CSS px × light and dark = 10 viewport/theme cases. The source passed no horizontal overflow, correct rendered background color (#ECEEE8 for light, #06171C for dark), active theme control, working primary WhatsApp href and patient education destination, no uncaught JavaScript errors. Mobile 320-430: floating CTA hidden on initial render, width 50px, hero photography visible significantly sooner. Screenshots inspected at 390 and 1440.
Limits: Brave Night Mode override is browser-controlled. Real deployed origin and physical Android Brave/iOS Safari were NOT tested.
