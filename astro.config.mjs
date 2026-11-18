// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://beachvolleyballtv.com.au',
  // Server mode: pages read content/*.json on each request, so edits made in
  // the admin go live instantly without a rebuild.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  // Cross-site request checks are done in src/middleware.ts (compares Origin
  // with the Host the server is reached on, which also works behind proxies).
  security: { checkOrigin: false },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
