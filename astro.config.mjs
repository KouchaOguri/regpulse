import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.SITE_URL || 'https://regpulsehq.com';
const basePath = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : '/';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({
      // Strictly isolate /cn/ cross-border routes and raw JSON feeds out of US English search sitemaps
      filter: (page) => !page.includes('/cn/') && !page.includes('/feeds/'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
});
