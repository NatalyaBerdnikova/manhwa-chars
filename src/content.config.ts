import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localized = z.object({
  ru: z.string().min(1),
  en: z.string().min(1).optional(),
});

const slug = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a lowercase latin slug: letters, numbers, and hyphens.');

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works', retainBody: true }),
  schema: ({ image }) =>
    z.object({
      title: localized,
      originalTitle: z.string().min(1).optional(),
      altTitles: z.array(z.string().min(1)).optional(),
      description: localized,
      cover: image(),
      year: z.number().int().min(1900).max(2100).optional(),
      author: z.string().min(1).optional(),
      status: z.enum(['ongoing', 'completed', 'hiatus']).optional(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
    }),
});

const characters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/characters', retainBody: true }),
  schema: ({ image }) =>
    z.object({
      name: localized,
      work: slug,
      image: image(),
      bio: localized.optional(),
      tags: z.record(z.string(), z.string()).optional(),
      featured: z.boolean().optional(),
      added: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use an added date like 2026-11-09.')
        .optional(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { works, characters };
