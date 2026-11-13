# LYMELVA: editorial education visuals + desktop intro v7

- Kept existing LYMELVA logo, brand colors and panoramic desktop composition.
- 30 distinct image files, one for each bilingual article; 14 documentary-style illustrative photos, 16 original editorial illustrations with relevant pictograms. No surgical outcome or before-and-after imagery.
- Image alternatives follow each article's title and identify illustration versus documentary scene.
- Automatic desktop intro extended to 4.8 seconds. Permanent desktop replay button added to header alongside existing hero replay action. Desktop photo breathes gently on devices where motion is permitted.
- Accessibility: automatic animation still respects OS reduced-motion; deliberate replay is opt-in and has a Skip button.
- Test: npm run build + browser playback smoke and mobile layouts. Images are illustrations/representations, not actual clinic photos. Medical content unchanged.
- Vercel live-origin and real hardware remain separate QA gates; do not assert without testing.
