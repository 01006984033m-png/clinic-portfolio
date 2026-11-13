# Security, privacy and release boundaries

This repository is a provisional **static** clinic portfolio with public educational resources. It does not store patient records or transmit appointments.

- External network requests are not required for core functionality.
- The contact form creates a client-only text summary. It does not send a message or confirm a booking; use no sensitive health details.
- External citations open with `rel="noopener noreferrer"`.
- The default hosting configuration includes restrictive security headers and a CSP permitting inline site scripts/styles, with `connect-src 'none'`. Move inline code to versioned files and remove `unsafe-inline` before a higher-assurance production launch.
- Contact forms, WhatsApp reminders, WhatsApp Business API, scheduling and any AI features must undergo independent privacy/security and medical-content review before connection.
- No personal, health, medical history, or patient-upload features should be added without explicit consent and a reviewed protected backend.
- Do not expose developer tokens, API keys, production credentials or real patient data in commits.
- `robots.txt` and `noindex` deliberately prevent public discovery during clinical review.

**No safety certification is implied by inclusion of these files.**
