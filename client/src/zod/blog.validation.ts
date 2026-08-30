import { z } from "zod";

export const blogSchema = z.object({
  title: z.string().min(3, "Title required (min 3 chars)"),
  slug: z
    .string()
    .min(3, "Slug required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  excerpt: z.string().min(10, "Excerpt required (min 10 chars)"),
  body: z.string().min(10, "Body content required (min 10 chars)"),
  publishStatus: z.enum(["draft", "publish"]).default("draft"),
});
