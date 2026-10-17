// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  // Replace with the real domain once the Vercel project exists.
  site: 'https://decision-atlas.vercel.app',
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
