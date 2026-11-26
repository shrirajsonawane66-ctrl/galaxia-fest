import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

import { EVENTS_TAG, listAllEvents, setEventStatus } from "@/lib/events/store";
import { requireAdmin } from "@/lib/performers/auth";
import {
  listAllPerformers,
  PERFORMERS_TAG,
  setPerformerStatus,
} from "@/lib/performers/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-click publishing for the admin panel.
 *
 * Every item is edited as a draft and only appears on the public site once it
 * is published. This endpoint finds everything that is waiting to go live and
 * publishes it in one pass:
 *
 * - performers: drafts that already have a photo
 * - events: every draft
 *
 * Draft performers without a photo are skipped (the public gallery would show
 * an empty tile); the response reports them so the admin can fix the photo and
 * press the button again.
 */

type PublishFailure = { kind: "performer" | "event"; name: string; error: string };

async function collectPending() {
  const [performers, events] = await Promise.all([
    listAllPerformers(),
    listAllEvents(),
  ]);

  const performersToPublish = performers.filter(
    (performer) => performer.status === "draft" && Boolean(performer.image?.trim())
  );
  const performersMissingPhoto = performers.filter(
    (performer) => performer.status === "draft" && !performer.image?.trim()
  );
  const eventsToPublish = events.filter((event) => event.status === "draft");

  return { performersToPublish, performersMissingPhoto, eventsToPublish };
}

function summarise(
  performersToPublish: { id: string; name: string }[],
  performersMissingPhoto: { id: string; name: string }[],
  eventsToPublish: { id: string; eventName: string }[]
) {
  return {
    pending: performersToPublish.length + eventsToPublish.length,
    performers: {
      drafts: performersToPublish.length + performersMissingPhoto.length,
      publishable: performersToPublish.length,
      missingPhoto: performersMissingPhoto.map((performer) => performer.name),
    },
    events: {
      drafts: eventsToPublish.length,
      publishable: eventsToPublish.length,
    },
  };
}

/** Read-only count used to show a badge on the publish button. */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  try {
    const { performersToPublish, performersMissingPhoto, eventsToPublish } =
      await collectPending();
    return NextResponse.json(
      summarise(performersToPublish, performersMissingPhoto, eventsToPublish)
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not check for unpublished changes.",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.message }, { status: gate.status });
  }

  let pending;
  try {
    pending = await collectPending();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load unpublished changes.",
      },
      { status: 500 }
    );
  }

  const { performersToPublish, performersMissingPhoto, eventsToPublish } = pending;

  if (performersToPublish.length + eventsToPublish.length === 0) {
    return NextResponse.json({
      published: { performers: 0, events: 0 },
      skipped: { performers: performersMissingPhoto.map((p) => p.name) },
      failures: [] as PublishFailure[],
      message:
        performersMissingPhoto.length > 0
          ? "Nothing to publish. Draft performers without a photo were skipped."
          : "Everything is already published.",
    });
  }

  const published = { performers: 0, events: 0 };
  const failures: PublishFailure[] = [];

  for (const performer of performersToPublish) {
    try {
      await setPerformerStatus(performer.id, "published");
      published.performers += 1;
    } catch (error) {
      failures.push({
        kind: "performer",
        name: performer.name,
        error: error instanceof Error ? error.message : "Publish failed.",
      });
    }
  }

  for (const event of eventsToPublish) {
    try {
      await setEventStatus(event.id, "published");
      published.events += 1;
    } catch (error) {
      failures.push({
        kind: "event",
        name: event.eventName,
        error: error instanceof Error ? error.message : "Publish failed.",
      });
    }
  }

  // Refresh the cached public pages so the change is visible immediately.
  revalidatePath("/");
  revalidatePath("/events");
  revalidateTag(PERFORMERS_TAG);
  revalidateTag(EVENTS_TAG);

  return NextResponse.json({
    published,
    skipped: { performers: performersMissingPhoto.map((p) => p.name) },
    failures,
  });
}
