# Feature Parity / Scope Ledger — LYMELVA v1

Reference: independent read-only review of `01006984033m-png/Elhady-works` `README.md`, `docs/FEATURE_PARITY_AND_RELEASE.md` and `src/App.tsx` (2026-11-13). No source file, image, product claim, or contact detail was copied from ELHADY Works or V.East. Adapted portable product behaviors only.

| Source product behavior | LYMELVA implementation | State |
|---|---|---|
| Branded cinematic intro + skip + reduced motion | LYMELVA SVG wave opening, timed fade, skip | Built, browser tested |
| Animated editorial hero / storytelling | Custom fluid SVG artwork, kinetic ribbon, tactile CTAs | Built, browser tested |
| Arabic RTL / English LTR | Full two-way bilingual text and persistence | Built, browser tested |
| Sun/moon celestial theme | Animated sun/moon toggle; full palette; persisted | Built, browser tested |
| Scroll-aware header and active nav | Direction-responsive header and active nav observer | Built; scroll-on-real-device still to test |
| Mobile nav + Escape + focus | Responsive overlay, inert / keyboard close / trap | Built, browser tested |
| Filterable gallery and accessible modal | Educational topics filtered by topic + service details; keyboard and backdrop close | Built, browser tested |
| Services/pillars/process timeline | Lymphedema services and 4-step care pathway | Built |
| Interactive workflow | Care stages + non-diagnostic Guided Care Explorer | Built; not a clinician or AI agent |
| FAQs | Accessible accordion | Built, browser tested |
| Downloadable original PDF brochures | 3 bilingual original educational PDF guides | Built, PDF pages and output checked |
| Smart contact brief | Local-only validated enquiry text + copy/download | Built, browser tested; **NO SEND** |
| Floating request CTA | Visible when relevant, hidden at contact | Built |
| SEO/Open Graph | Provisional metadata + medical-clinic concept schema | Built, **noindex** until launch |
| Accessibility / motion | Reduced motion, visible focus, keyboard modal trap, responsive | Implemented; formal accessibility audit pending |
| AI Studio or true agentic chat | Only an honest rule-based educational guide, no AI endpoint | **NOT IMPLEMENTED**; needs approved provider/privacy architecture |
| Live appointment booking, CRM or WhatsApp delivery | Local summary only | **NOT IMPLEMENTED**; needs approved channels/backend |
| Clinical patient portal/data storage | Not requested as part of public showcase; no PHI saved | **NOT IMPLEMENTED** |
| Real clinic assets, team and patient testimonials | No fabricated evidence | **PENDING** verified clinic information and consent |

**Safety:** no automatic import of third-party/protected code and no mutation of source repositories. Do not report full ELHADY Works parity as complete; this is front-end feature parity for the portable portfolio behaviors.
