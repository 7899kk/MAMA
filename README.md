# Ashok Kunchala — Portfolio

Standalone portfolio with the reference video's hero, highlighted About section, interactive pirate map, eight skill cards, project links, Education/Languages panels, and taped contact cards. Journal and project content open locally. LinkedIn is the only external profile link. The Email card opens the contact form.

## Run

Node 24+ required. No npm dependencies to install. Run `npm run dev` from the repository root; port 3000. Run `npm run check` and `npm test` for validation. No build step.

## Gmail contact form

The form submits to the same-origin `/api/contact` backend. Messages go to `CONTACT_TO` and are sent through the authorized Gmail account. The address must have Gmail/Google Workspace mail enabled.

Configure these variables securely on the running backend:

- `CONTACT_TO`: recipient mailbox.
- `GMAIL_FROM`: authorized sending mailbox; defaults to `CONTACT_TO`.
- `GMAIL_OAUTH_CLIENT_ID`: Google OAuth application client ID.
- `GMAIL_OAUTH_CLIENT_SECRET`: OAuth client secret.
- `GMAIL_OAUTH_REFRESH_TOKEN`: refresh token authorized for `https://www.googleapis.com/auth/gmail.send`.
- `PUBLIC_ORIGIN`: optional exact deployed origin.

Use Google OAuth authorization with offline access to obtain the refresh token. Keep the secret and refresh token in environment settings; never commit them or enter them in chat. A short-lived `GMAIL_ACCESS_TOKEN` is supported as an alternative to the refresh configuration. It expires and is unsuitable for unattended long-term use.

For local development, `.env.example` lists the keys. An ignored `.env` is optional. Cloud proxy-backed secrets work through Google's HTTPS endpoints; npm scripts enable Node's environment proxy support.

The backend validates fields, rejects email-header injection and honeypot submissions, enforces message size and rate limits, restricts POST requests to the site's origin, and shows success only after Gmail returns a message ID. Failed sends retain the visitor's text. No email is sent while credentials are missing. Mocked tests do not establish real Gmail delivery.

## Hosting

A server is required for contact-form submissions. GitHub Pages and RawGitHack serve static files and cannot run this Gmail backend. Deploy the whole repository to a Node host, or import it into Vercel using the supplied `vercel.json` and configure the variables above in that project's settings. A static preview remains useful for design review; the contact form will show unavailable until its backend is hosted and authorized. Cloud environment variables are not automatically copied to an external hosting account.

## Performance

WebP images replace the large PNGs, fonts are subsetted and served locally as WOFF2, the hero font is preloaded, below-fold images are lazy-loaded, and the decorative loading screen has been removed. The Node server compresses text with Brotli/gzip, caches file bytes, and supports ETags. It serves only the public page, scripts/styles, and supported assets; reference archives, source helpers, and environment files are not public routes.

`portfolio-download/` and `screenshots/` are ignored local reference material. Fonts include their licenses. No external font, map, or UI service is needed to display the page.
