# Publish the LYMELVA prelaunch preview
Date: 2026-11-13

## Repository and verified source
- Repository: https://github.com/01006984033m-png/clinic-portfolio
- Branch: main
- Node 22 `npm test`: PASS on the reviewed full source, including 30 bilingual education topics, 15 citations and all media file checks.
- Preview publishing is **blocked by GitHub Pages setup**, not by the site build.

## One-time owner activation on GitHub
1. Open https://github.com/01006984033m-png/clinic-portfolio/settings/pages (sign in as the owner).
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Save.
4. Open https://github.com/01006984033m-png/clinic-portfolio/actions/workflows/pages-preview.yml and choose **Run workflow** on `main`.
5. Wait for a green deployment; only then verify the actual URL shown in the job environment. The expected GitHub Pages address `https://01006984033m-png.github.io/clinic-portfolio/` is **not verified live** as of this report.
6. Check `/education/`, `/privacy.html`, three PDF downloads, and the Arabic/English and light/dark controls at the actual hosted URL.

## Other attempted hosting routes (not deployed)
- Vercel project creation: HTTP 403 forbidden (insufficient workspace permission).
- Cloudflare Pages Git integration: HTTP 401 internal Git installation failure.
- GitHub Pages action attempting to enable Pages: Resource not accessible by integration (must be enabled from owner Settings).

## Release safeguards
This site stays noindex with a clear preliminary identity label. It has no clinical booking backend or medical data collection. Before public patient promotion: verify real clinic name/address/contact, legally approve privacy/legal content, obtain clinical article + PDF sign-off, then remove noindex only when appropriate.
