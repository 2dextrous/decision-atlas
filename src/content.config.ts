import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const stations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/stations' }),
  schema: z.object({
    title: z.string(),
    line: z.string(),
    summary: z.string(),
    /** Reading time per level, in minutes. */
    minutes: z
      .object({ gist: z.number(), how: z.number().optional(), deep: z.number().optional() })
      .refine((m) => !m.deep || m.how, { error: 'A deep dive needs a "how it works" level first.' }),
    /** 'draft' until the author has checked every claim; then 'reviewed' with a date. */
    status: z.enum(['draft', 'reviewed']).default('draft'),
    reviewed: z.coerce.date().optional(),
    keywords: z.array(z.string()).default([]),
    connected: z.array(z.string()).default([]),
    sources: z
      .array(z.object({ text: z.string(), url: z.url().optional() }))
      .default([]),
  }),
});

export const collections = { stations };
