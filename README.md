# LYMELVA — Lymphedema Clinic | Full Static Release Candidate

**Status:** prelaunch / noindex. Owner sign-off required before patient-facing production. Last updated: 13 November 2026.

This is the full visual-brand version of the clinic site, including the standalone bilingual patient education hub. The GitHub baseline previously contained a reduced bundle missing the actual PDF handouts and full visual assets. This package restores those files.

## Included
- `index.html` / `styles.css` / `app.js`: cinematic responsive clinic website in Arabic and English, light/dark theme, interactive services, FAQs, information explorer, and contact-summary-only form.
- `education/index.html` / `education/content.js` / `education/education.js` / `education/education.css`: **30 bilingual educational articles**, search, categories, source links, article dialog, print, copy and emergency alert.
- `guides/*.pdf`: three bilingual original printable patient guides and preliminary brand guidelines.
- `assets/*`: brand SVG variants plus visual board.
- `privacy.html`: transparent bilingual draft privacy notice.
- `tests/check.mjs`: offline release checks.
- `vercel.json` / `_headers`: site-level security headers; no backend/API permissions.

## Local running/testing

```sh
python -m http.server 8000
# open http://localhost:8000
node tests/check.mjs
```

No npm install or paid API is required.

## Strict release gates
1. Approve actual clinic name and trademark clearance. **LYMELVA is provisional.**
2. Add *verified* address, public email/phone, credentials and operating hours. Do not reuse ELHADY Works contact details.
3. A qualified practitioner must review/sign off every patient article and handout; document review date and author/credentials; update as evidence evolves.
4. Approve local health advertising and privacy legal obligations.
5. Only after clinic approval: set an official domain, SEO canonical, business metadata, and remove `noindex`/robots disallow.
6. Implement a consent-aware secure backend before accepting appointments or health data; until then the form is **local-only and never transmits**.
7. Test final deployed origin and actual iOS/Android browsers before claiming cross-device production QA.

**Medical references:** ISL 2023, NHS, APTA, NCI and additional sources listed in `education/content.js` and linked inside articles. This is NOT a clinical protocol or patient-specific advice.
