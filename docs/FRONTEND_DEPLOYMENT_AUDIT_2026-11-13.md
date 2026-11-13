# LYMELVA — Frontend and Deployment Verification (13 Nov 2026)

## Scope
Evidence-based check of the source in `main` at `b2c070276668306ed2467759745c65c1364218e3` (at the start of this review). The target deployment account is `clinic.project.mti@gmail.com`, team `clinic-8036`.

## Verified — local source and GitHub
- `npm run build` passed and assembled exactly 18 public output artifacts in `dist/`.
- GitHub Actions workflow `LYMELVA static quality` completed **success** for commit `b2c0702`: https://github.com/01006984033m-png/clinic-portfolio/actions/runs/43465235023
- 30 bilingual education topics / 15 linked source entries; clinical sign-off is not yet recorded.
- Four readable PDF files: 3 patient guides (one page each) and the 4-page preliminary brand guide.
- **56/56 responsive matrix** in headless Chromium: homepage and education page, at 320 / 360 / 390 / 430 / 768 / 1024 / 1440 CSS px, both Arabic and English and light/dark. Zero root horizontal overflow, broken image elements, or uncaught JavaScript exceptions.
- **68/68 interactive checks** in headless Chromium at 320 / 390 / 768 / 1440 CSS px: service cards, modal close/Escape, FAQ, guided navigator, form validation/local-only summary, 30 education cards, no-results search, reset, filtering and article dialog.
- **31/31 local HTML resource/anchor references** resolved inside the staged `dist` tree, with 0 missing files.
- `vercel.json` specifies `npm run build` and `dist` output. The contact form is a client-only draft generator and **does not transmit patient data or create appointments**.

## Test limitations
The headless browser in this environment blocks `http://127.0.0.1` and `file://` navigation. Browser checks therefore used HTML/CSS/JS injected as embedded content via `page.set_content`; external assets were inlined. These verify rendering and client interactions **but do not prove live HTTP file delivery, CSP response headers, production deployment, real iOS Safari/Android hardware performance, or full WCAG compliance**.

## Vercel deployment blocker — not a verified live release
- The connected account identity matches `clinic.project.mti@gmail.com`.
- Vercel API returned **zero projects and zero deployments** both in the account root and team `clinic-8036`.
- Previously, Vercel rejected project creation and deployment with HTTP 403 (no permission to create project).
- GitHub repository homepage currently names `https://clinic-portfolio-sigma.vercel.app`, but the connected Vercel account returns **404 deployment not found** for it, and public fetch did not verify the URL. Do **not** mark it deployed or live on this evidence.

## Remaining launch gates
1. Locate/authorize the actual Vercel project in the connected account, or create/link it through the owner's Vercel dashboard and deploy exactly the reviewed commit.
2. Run real-origin smoke tests on `/`, `/education/`, `/privacy.html`, all styles/scripts/assets/PDFs; verify CSP and status codes.
3. Test on a physical Android Chrome and iOS Safari device, including keyboard and touch interactions.
4. Clinically sign off the articles and PDFs, verify official clinic identity/contact details, and obtain legal/brand approval.
5. If online bookings are required, implement secure booking and verified delivery first; this static portfolio is not a clinical booking system.
6. Keep `noindex` while a prelaunch concept and medical editorial work remain incomplete.

**Conclusion:** Strong local frontend evidence, GitHub build pass, **Vercel production NOT VERIFIED**. Do not claim 100% patient-ready or deployed.
