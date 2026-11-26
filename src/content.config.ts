// SPDX-License-Identifier: AGPL-3.0-only
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const docs = defineCollection({
  loader: docsLoader(),
  schema: docsSchema({
    extend: z.object({
      generated: z.boolean().optional(),
      app_version: z.string().optional(),
      frozen: z.boolean().optional(),
      translation_status: z.enum(['human', 'machine', 'none']).optional(),
    }),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md?(x)', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    version: z.string().optional(),
    draft: z.boolean().default(false),
    lang: z.enum(['en', 'fr']).default('en'),
    range: z.string().optional(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md?(x)', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lang: z.enum(['en', 'fr']),
    updated: z.coerce.date(),
  }),
});

export const collections = { docs, blog, legal };
