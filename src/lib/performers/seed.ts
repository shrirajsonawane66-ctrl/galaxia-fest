import { seedPerformers } from "../performers";

import type { PerformerRecord } from "./types";

const now = "2025-11-01T00:00:00.000Z";

/**
 * Local-development seed. The SQL migration inserts the same 12 placeholders as
 * drafts so they never appear in the public gallery until an admin publishes
 * them or replaces them with real performers.
 */
export const samplePerformers: PerformerRecord[] = seedPerformers.map(
  (performer, index) => ({
    ...performer,
    status: "draft",
    sortOrder: index + 1,
    createdAt: now,
    updatedAt: now,
  })
);
