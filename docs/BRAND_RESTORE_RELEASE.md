# LYMELVA — original desktop composition + identity-conformant themes

Date: 2026-11-13. Scope: **additive restoration** on top of the verified `7c3f19f` release. No removal of existing content, patient education, or WhatsApp workflow.

## Owner requests implemented
- Restore split desktop hero: treatment photograph on the left and right-aligned Arabic copy, clean rectangular header, compact service imagery directly after an *early* patient-education panel. This restores the screenshot's structure rather than rebranding to unapproved gold.
- Keep brand colors **exactly** per the preliminary LYMELVA brand guide: Midnight Teal `#0B4550`, Ocean Teal `#218F91`, Seafoam `#B7DCD2`, Warm Ivory `#F7F4ED`; existing original flowing L monogram retained.
- Deep dark theme (`#06171c`) throughout homepage, education, and privacy; contrasting warm-ivory light theme. Navigation, controls, and reading text were adjusted for legibility.
- Move the **single** existing patient education promotion panel from below the articles to the first area after the hero/ticker; make it stronger; change the hero secondary CTA to `/education/`. Education is also first in desktop/mobile nav.
- Put services before about for early discovery, with original service details/images retained. Do not duplicate articles or change medical information.
- Preserve AR/EN switches, sun/moon, motion with reduced-motion support, existing image assets and WhatsApp `+201027594048`.

## Local evidence
- `npm run build` (including Node source QA) PASS, releasing 31 static files to `dist/`.
- Headless embedded Chromium QA: **40/40** combinations of 320, 390, 768, 1440 px × selected AR/EN × light/dark across homepage, education, privacy; no root horizontal overflow or browser JS errors in these tests.
- User interactions: intro and 9 animations present; Skip, service detail modal/Escape, responsive menu/Escape, WhatsApp href, AR/EN toggle and dark toggle PASS.
- Browser sandbox blocks `localhost` origins with `ERR_BLOCKED_BY_ADMINISTRATOR`, so HTML, JS and images were safely embedded for local QA; this is **not** a production HTTP smoke test.

## Release gates still outside scope
- Public Vercel environment needs independent checked deployment state and exact Git commit before the public link is called verified.
- Physical Android Chrome and iOS Safari device passes not conducted.
- LYMELVA branding remains provisional pending commercial clearance; content review and clinic details also need sign-off. Photos are illustrative, not real patients from the clinic. Contact is WhatsApp only, not a booking system.
