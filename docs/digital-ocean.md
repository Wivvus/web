# Hosting the Wivvus Frontend on DigitalOcean App Platform

This guide covers deploying the Angular frontend using DigitalOcean App Platform as a **Static Site**, which deploys directly from your GitHub repository and automatically redeploys on every push to `main`.

---

## Overview

DigitalOcean App Platform static sites:

- Pull code directly from GitHub
- Run `npm run build` automatically
- Serve the compiled output as a global CDN-backed static site
- Manage TLS certificates and a public HTTPS URL
- Redeploy automatically on every push to `main`
- Are **free** for static sites on the Starter plan

---

## Prerequisites

- A DigitalOcean account
- The frontend repository pushed to GitHub (`github.com/Wivvus/web`)
- The API already deployed and reachable at a public URL (e.g. `https://api.wivvus.com`)

---

## 1. Set the Production Environment

Before deploying, update `src/environments/environment.ts` with your real API URL and Google OAuth client ID:

```typescript
export const environment = {
  production: true,
  googleClientId: '<your-google-client-id>',
  apiUrl: 'https://api.wivvus.com'
};
```

Commit and push this change to `main`:

```bash
git add src/environments/environment.ts
git commit -m "Configure production environment"
git push origin main
```

> The services import from `environment.development.ts` by default. During a production build, Angular automatically replaces `environment.development.ts` with `environment.ts` via `fileReplacements` in `angular.json`. So `environment.ts` is what gets used in production — never put `localhost` URLs there.

---

## 2. Create the App

1. In the DigitalOcean control panel, go to **App Platform → Create App**.
2. Choose **GitHub** as the source.
3. Authorise DigitalOcean to access your GitHub account if prompted.
4. Select the `Wivvus/web` repository and the `main` branch.
5. Enable **Autodeploy** — this redeploys the site automatically on every push.
6. Click **Next**.

---

## 3. Configure the Static Site Component

App Platform will detect `package.json` and suggest a Static Site component.

Confirm the following settings:

| Field | Value |
|---|---|
| **Type** | Static Site |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist/web/browser` |

App Platform detects these automatically, but double-check that the output directory matches exactly.

Click **Next**.

---

## 4. Configure SPA Routing

Angular uses HTML5 `pushState` routing — navigating to a URL like `/events/123` directly would return a 404 unless the server falls back to `index.html`.

In the component settings, find **Routes** (or **Error Pages**) and set:

- **Catchall route:** `/` → serves `index.html`

Alternatively, this is configured in App Platform under **Settings → Components → Routes**:

| Route | Behaviour |
|---|---|
| `/*` | Serve `index.html` |

This ensures deep links and page refreshes work correctly.

---

## 5. Choose a Plan and Deploy

1. Static sites are **free** on the Starter plan — select it.
2. Review the summary and click **Create Resources**.

App Platform will clone the repository, run `npm run build`, and publish the output to its CDN. The first deploy takes a few minutes.

---

## 6. Get Your Site URL

Once deployed, App Platform assigns a public URL like:

```
https://wivvus-web-xxxx.ondigitalocean.app
```

Find it under **App Overview → Live URL**.

---

## 7. Add a Custom Domain (Optional)

1. In the App settings, go to **Domains → Add Domain**.
2. Enter your domain, e.g. `wivvus.com` or `www.wivvus.com`.
3. Follow the instructions to add a CNAME record in your DNS provider pointing to the App Platform URL.
4. App Platform provisions a Let's Encrypt certificate automatically.

---

## 8. Update CORS on the API

Once the frontend is live at its public URL, update the `ALLOWED_ORIGINS` environment variable on the API App to include it:

```
https://wivvus.com
```

In the API app's settings go to **Environment Variables** and update `ALLOWED_ORIGINS`, then save. This triggers a redeploy of the API.

---

## 9. Update Google OAuth Authorised Origins

In the [Google Cloud Console](https://console.cloud.google.com):

1. Go to **APIs & Services → Credentials**.
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorised JavaScript origins**, add your production frontend URL:
   ```
   https://wivvus.com
   ```

---

## Ongoing Operations

### Deploying an update

Push to `main` — App Platform detects the push, rebuilds, and redeploys automatically.

```bash
git push origin main
```

### Viewing build logs

In the App Platform dashboard, go to **Deployments** and click a deployment to see the full build output, including the `npm run build` log.

### Changing the API URL

Update `src/environments/environment.ts` with the new URL and push. App Platform will rebuild and redeploy.
