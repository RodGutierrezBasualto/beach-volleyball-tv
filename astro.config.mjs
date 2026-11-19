// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://beachvolleyballtv.com.au',
  // Public pages are built ahead of time from content/*.json (fast, and they
  // never "sleep"). Only the admin, its API and the photo fallback run as a
  // Cloudflare Worker. Admin saves commit to GitHub, which rebuilds the site.
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough', platformProxy: { enabled: false } }),
  // Cross-site request checks are done in src/middleware.ts (compares Origin
  // with the Host the server is reached on).
  security: { checkOrigin: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
