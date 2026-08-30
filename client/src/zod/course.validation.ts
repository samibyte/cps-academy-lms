import * as zod from "zod";
export const courseSchema = zod.object({
  title: zod.string().min(3, "Title must be at least 3 characters"),
  slug: zod
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  shortDescription: zod.string().min(10, "Short description is required"),
  description: zod.string().optional(),
  level: zod.enum(["Beginner", "Intermediate", "Advanced"]),
  price: zod.coerce.number().optional(),
  isFree: zod.boolean(),
  isFeatured: zod.boolean(),
  tags: zod.array(zod.string().trim().min(1)).optional(),
  instructor: zod.string().optional(),
});