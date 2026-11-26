import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const siteUrl = process.env.SITE_URL || 'https://kouchaoguri.github.io';
const basePath = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : '/regpulse';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
});
