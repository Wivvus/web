# Hosting the Wivvus Frontend on DigitalOcean App Platform

The Angular frontend uses **Server-Side Rendering (SSR)** via a Node.js/Express server, so it must be deployed as a **Web Service** (not a Static Site) on App Platform. This costs **$5/month** on the Basic plan.

---

## Overview

The build produces two output folders under `dist/web/`:

- `browser/` — static assets (JS, CSS, images) served directly by Express
- `server/server.mjs` — the Express/Angular SSR server that handles all requests

App Platform:
- Pulls code from GitHub
- Runs `npm run build` to produce both folders
- Starts the server with `node dist/web/server/server.mjs`
- Injects `PORT=8080`; the server reads `process.env['PORT']` automatically
- Redeploys on every push to `main`

---

## Prerequisites

- A DigitalOcean account
- The `Wivvus/web` repository pushed to GitHub
- The API already deployed at a public URL (e.g. `https://api.wivvus.com`)

---

## Migrating from a Static Site deployment

If the app is currently deployed as a Static Site on App Platform, you need to **delete** that component and replace it with a Web Service — App Platform does not allow changing a component's type in place.

1. Go to the App in App Platform.
2. Open **Settings → Components** and delete the static site component.
3. Click **Edit → Add Component** and follow the steps below.

Or delete the entire App and create a new one.

---

## 1. Create the App

1. In the DigitalOcean control panel, go to **App Platform → Create App**.
2. Choose **GitHub** as the source.
3. Select the `Wivvus/web` repository and the `main` branch.
4. Enable **Autodeploy**.
5. Click **Next**.

---

## 2. Configure the Web Service Component

App Platform may detect it as a Static Site — change it to **Web Service**.

| Field | Value |
|---|---|
| **Type** | Web Service |
| **Build Command** | `npm run build` |
| **Run Command** | `node dist/web/server/server.mjs` |
| **HTTP Port** | `8080` |

Leave the output directory blank — Express serves files directly from `dist/web/browser/`.

---

## 3. Choose a Plan and Deploy

Web Services require a paid plan — the **Basic** tier at **$5/month** is sufficient.

Review the summary and click **Create Resources**. The first deploy takes a few minutes.

---

## 4. Get Your Site URL

Once deployed, App Platform assigns a URL like:

```
https://wivvus-web-xxxx.ondigitalocean.app
```

---

## 5. Add a Custom Domain

1. In the App settings, go to **Domains → Add Domain**.
2. Enter your domain (e.g. `run.wivvus.com`).
3. Add a CNAME record in your DNS provider pointing to the App Platform URL.
4. App Platform provisions a Let's Encrypt certificate automatically.

---

## 6. Update CORS on the API

Add the production frontend URL to `ALLOWED_ORIGINS` on the API App:

```
https://run.wivvus.com
```

In the API app's settings go to **Environment Variables → ALLOWED_ORIGINS** and update it, then save. This triggers a redeploy.

---

## 7. Update Google OAuth Authorised Origins

In the [Google Cloud Console](https://console.cloud.google.com):

1. Go to **APIs & Services → Credentials**.
2. Edit your OAuth 2.0 Client ID.
3. Under **Authorised JavaScript origins**, add:
   ```
   https://run.wivvus.com
   ```

---

## Ongoing Operations

### Deploying an update

Push to `main` — App Platform rebuilds and redeploys automatically.

### Viewing build logs

In the App Platform dashboard, go to **Deployments** and click a deployment to see the full build output.

### Changing the API URL

Update `src/environments/environment.ts` with the new URL and push.
