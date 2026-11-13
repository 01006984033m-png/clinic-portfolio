# LYMELVA incident recovery — 2026-11-13

Requested because the owner reports the public clinic website unavailable.

This is a **non-destructive production redeploy trigger**. No public HTML, CSS, JS, patient education, images, booking behavior, credentials, or branding has been altered.

Preserved source before recovery: `bbd64ec7d69eb7f11e8ca2a77e3d2cc708a359aa`
Site previously used: `https://clinic-portfolio-sigma.vercel.app/`

Evidence:
- Latest static GitHub Actions check passed for the preserved source.
- GitHub Vercel integration reported the previous deployment completed.
- Live origin could not be verified from the assistant's public URL inspection environment.
- The connected Vercel API account was unable to list the project or deployments, so this commit **does not claim the live site is repaired**.

Next: verify the new commit's GitHub/Vercel checks, then obtain an HTTP status or screenshot from the actual public origin. If a new deployment succeeds but the site stays inaccessible, inspect Vercel Domains / deployment protection / project ownership without destructive source rollback.
