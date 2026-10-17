// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// On Vercel, use the project's production domain (custom domain if one is set) for canonical
// and link-preview URLs. Locally, fall back to the expected vercel.app address.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || 'decisionatlas.vercel.app';

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
});
