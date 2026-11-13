# LYMELVA — Light Comfort theme update
Date: 2026-11-13

Scope: reduce visual brightness of the existing light theme without modifying the approved hero composition, photography, WhatsApp action, education CTA, or dark theme.

- Light background: #ECEEE8; secondary: #E7EDE7; original Warm Ivory #F7F4ED remains card tone.
- Primary brand colors preserved: Midnight Teal #0B4550, Ocean Teal #218F91, Seafoam #B7DCD2, Warm Ivory #F7F4ED.
- The new additive CSS uses html[data-theme="light"] only, plus standalone privacy styles.
- Local npm run build PASS; 32 public artifacts in dist.
- Embedded Chromium tests at 390/1440 CSS pixels in both light and dark for homepage and education page: no JavaScript errors, no horizontal overflow, and no broken **visible** images (8 checks).
- Computed light body #ECEEE8; dark hero body #06171C. Education hero light #E7EDE7; dark #06171C.
- Screenshots locally captured. Full live production, iOS Safari and Android native-device verification have not been performed.
- No patient data transmission, treatment claims, branding images, or clinical articles were modified.
