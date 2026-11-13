# LYMELVA desktop entrance v8 — root cause and verification

## Verified faults in earlier code
1. Editorial stylesheet had `.hero-photo {transform:none!important}`. Author-important transform overrides keyframe transforms, so image movement was not visible even when animation-name was set. This restriction has been removed without changing the brand colors or layout.
2. `prefers-reduced-motion: reduce` caused the site to hide the introduction immediately. On desktop, a static introductory frame now appears with an explicit Play or Skip choice. Deliberate Play stores a visitor's site-specific motion opt-in.
3. A 4.8-second close timer started at DOMContentLoaded, potentially allowing styles and photos to load while the sequence had already been playing. The revised timeline awaits a critical load event with a bounded fallback and restarts keyframes; then plays for 6.1 seconds.
4. With reduced-motion enabled and no opt-in, ongoing hero motion stays disabled. After an explicit Play choice, image movement becomes available. Small-screen reduced-motion mode never blocks the homepage.

## Invariants
- No medical articles, photo assets, data handling, brand palette, WhatsApp number, or approved desktop hero layout was modified.
- Keep Skip and the persistent header/hero replay buttons.
- Preserve browser and OS reduced-motion settings, requiring a deliberate user click to opt into movement.

## Local verification
- npm run build: PASS; 64 static artifacts assembled.
- Embedded Chromium via page.set_content (localhost/file URL blocked by this environment):
  1440/1024 desktop auto intro shows with no-preference; 1440 reduced mode shows static frame with Play; clicking Play restarts animation and opts in; 390 mobile Skip and links work.
- The computed therapy photo transform was non-none and changed across frames; logo animation and replay worked. Zero uncaught JS exceptions.
- This is **local** evidence. Live Vercel-origin behavior and a physical Windows/desktop browser were not verified.
