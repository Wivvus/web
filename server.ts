import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { SSR_RESPONSE } from './src/tokens/ssr.tokens';

const SITEMAP_TTL_MS = 60 * 60 * 1000;
let sitemapCache: { xml: string; at: number } | null = null;

async function buildSitemap(): Promise<string> {
  const apiUrl = process.env['API_URL'] || 'http://localhost:8080';
  const siteUrl = process.env['CANONICAL_URL'] || 'http://localhost:4000';

  const staticUrls = [
    `<url><loc>${siteUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
  ];

  let eventUrls: string[] = [];
  try {
    const res = await fetch(`${apiUrl}/runs`);
    if (res.ok) {
      const events = await res.json() as Array<{ id: number; start_time?: string }>;
      eventUrls = events.map(e => {
        const lastmod = e.start_time ? e.start_time.substring(0, 10) : '';
        const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
        return `<url><loc>${siteUrl}/run/${e.id}</loc>${lastmodTag}<changefreq>weekly</changefreq><priority>0.8</priority></url>`;
      });
    }
  } catch {
    // API unavailable — return static-only sitemap
  }

  const urls = [...staticUrls, ...eventUrls].join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Short URLs: {event-type}.wivvus.com/:id → wivvus.com/:event-type/:id
  // Only fires on subdomains (e.g. run.wivvus.com), not on the canonical domain itself.
  server.get(/^\/(\d+)$/, (req, res, next) => {
    const host = req.hostname;
    const match = host.match(/^([a-z]+)\.wivvus\.com$/);
    if (match) {
      res.redirect(301, `https://wivvus.com/${match[1]}${req.path}`);
    } else {
      next();
    }
  });

  // Dynamic sitemap — always reflects current upcoming events
  server.get('/sitemap.xml', async (_req, res, next) => {
    try {
      if (!sitemapCache || Date.now() - sitemapCache.at > SITEMAP_TTL_MS) {
        sitemapCache = { xml: await buildSitemap(), at: Date.now() };
      }
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(sitemapCache.xml);
    } catch (err) {
      next(err);
    }
  });

  // Serve static files from /browser
  server.get('*.*', express.static(browserDistFolder, {
    maxAge: '1y'
  }));

  // All regular routes use the Angular engine
  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: SSR_RESPONSE, useValue: res },
        ],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
