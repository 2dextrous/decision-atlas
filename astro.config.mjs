// @ts-check
import { existsSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// On Vercel, use the project's production domain (custom domain if one is set) for canonical
// and link-preview URLs. Locally, fall back to the expected vercel.app address.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'decisionatlas.vercel.app';

// The dev server only serves exact public file paths, so /sap-process-map/ would fall through to
// the [line] route and 404. Serve public/<dir>/index.html for /<dir>/ in dev, as Vercel does.
/** @returns {import('vite').Plugin} */
function publicDirectoryIndex() {
  return {
    name: 'public-directory-index',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (/^(\/[\w-]+)+\/$/.test(path) && existsSync(new URL(`./public${path}index.html`, import.meta.url))) {
          req.url = `${path}index.html`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  site: `https://${productionHost}`,
  // Keep classic whitespace handling so inline elements keep their spaces.
  compressHTML: true,
  markdown: {
    // Astro 7 defaults to Sätteri; unified is needed for remark-math and rehype-katex.
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { strict: 'ignore' }]],
    }),
  },
  integrations: [mdx()],
  vite: { plugins: [publicDirectoryIndex()] },
});
