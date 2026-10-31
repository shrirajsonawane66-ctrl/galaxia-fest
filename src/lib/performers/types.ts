import { z } from "zod";

import type { Performer } from "../performers";

export type PerformerStatus = "draft" | "published";

export interface PerformerRecord extends Performer {
  status: PerformerStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const currentYear = new Date().getFullYear();

export const performerStatusSchema = z.enum(["draft", "published"]);

export const performerInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Keep the name under 60 characters"),
    year: z
      .number()
      .int("Use a whole year")
      .min(2000, "Year must be 2000 or later")
      .max(currentYear + 1, `Year cannot be later than ${currentYear + 1}`),
    role: z
      .string()
      .trim()
      .min(2, "Role must be at least 2 characters")
      .max(40, "Keep the role under 40 characters"),
    image: z.string().trim().max(2048, "Image path is too long"),
    status: performerStatusSchema,
  })
  .superRefine((value, ctx) => {
    if (value.status === "published" && !value.image) {
      ctx.addIssue({
        code: "custom",
        path: ["image"],
        message: "Add a photo before publishing",
      });
    }

    if (
      value.image &&
      !value.image.startsWith("/") &&
      !/^https?:\/\//i.test(value.image)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["image"],
        message: "Use an uploaded image or a valid http(s) URL",
      });
    }
  });

export type PerformerInput = z.infer<typeof performerInputSchema>;

export function toGalleryPerformer(record: PerformerRecord): Performer {
  return {
    id: record.id,
    name: record.name,
    year: record.year,
    role: record.role,
    image: record.image,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
