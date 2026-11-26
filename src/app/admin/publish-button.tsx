"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Rocket, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type PublishSummary = {
  pending: number;
  performers: {
    drafts: number;
    publishable: number;
    missingPhoto: string[];
  };
  events: {
    drafts: number;
    publishable: number;
  };
};

type PublishResult = {
  published: { performers: number; events: number };
  skipped: { performers: string[] };
  failures: { kind: "performer" | "event"; name: string; error: string }[];
  message?: string;
};

/**
 * One-click publishing for the whole admin panel.
 *
 * Performers and events are edited as drafts. This button collects every draft
 * that is ready and publishes it, then refreshes the cached public pages. It
 * stays in the sidebar (and in the mobile top bar) so future edits are always
 * one tap away from going live.
 */
export function PublishButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [summary, setSummary] = React.useState<PublishSummary | null>(null);
  const [open, setOpen] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await adminApi<PublishSummary>("/api/admin/publish");
      setSummary(data);
    } catch {
      // A failed count should never block the admin; the POST reports the real
      // error when the button is pressed.
      setSummary(null);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load, pathname]);

  React.useEffect(() => {
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const pending = summary?.pending ?? 0;
  const missingPhoto = summary?.performers.missingPhoto ?? [];
  const totalDrafts =
    (summary?.performers.drafts ?? 0) + (summary?.events.drafts ?? 0);

  const openDialog = () => {
    void load();
    setOpen(true);
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const result = await adminApi<PublishResult>("/api/admin/publish", {
        method: "POST",
      });

      const { performers, events } = result.published;
      if (performers + events > 0) {
        const parts: string[] = [];
        if (performers > 0) {
          parts.push(`${performers} performer${performers === 1 ? "" : "s"}`);
        }
        if (events > 0) {
          parts.push(`${events} event${events === 1 ? "" : "s"}`);
        }
        toast.success(`Published ${parts.join(" and ")}.`);
      } else {
        toast.message(result.message ?? "Everything is already published.");
      }

      if (result.skipped.performers.length > 0) {
        toast.warning(
          `Skipped ${result.skipped.performers.length} draft${
            result.skipped.performers.length === 1 ? "" : "s"
          } with no photo: ${result.skipped.performers.join(", ")}`
        );
      }

      if (result.failures.length > 0) {
        toast.error(
          `${result.failures.length} item${
            result.failures.length === 1 ? "" : "s"
          } could not be published. ${result.failures
            .map((failure) => `${failure.name}: ${failure.error}`)
            .join(" · ")}`
        );
      }

      setOpen(false);
      await load();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not publish changes."
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label={
          pending > 0
            ? `Publish ${pending} pending change${pending === 1 ? "" : "s"}`
            : "Publish changes"
        }
        className={cn(
          "group inline-flex items-center gap-2 rounded-full bg-[#E5121F] font-semibold text-white transition-colors hover:bg-[#FF1F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] disabled:pointer-events-none disabled:opacity-60",
          compact
            ? "h-11 shrink-0 px-3 text-sm"
            : "min-h-11 w-full justify-start px-4 py-2.5 text-sm"
        )}
      >
        <Rocket className="h-4 w-4 shrink-0" aria-hidden />
        <span>Publish</span>
        {!compact && <span className="font-normal text-white/80">changes</span>}
        {pending > 0 && (
          <span
            className={cn(
              "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black/25 px-1.5 text-xs font-bold tabular-nums",
              !compact && "ml-auto"
            )}
          >
            {pending}
          </span>
        )}
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!publishing) setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish changes</DialogTitle>
            <DialogDescription>
              {totalDrafts > 0
                ? "Make every ready draft visible on the public site right away."
                : "There is nothing waiting to be published."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-[var(--text-body)]">Performers</span>
              <span className="font-semibold text-[var(--text-strong)]">
                {summary ? summary.performers.publishable : "—"} ready
                {summary && summary.performers.drafts > 0 && (
                  <span className="ml-1 font-normal text-[var(--text-muted)]">
                    of {summary.performers.drafts} draft
                    {summary.performers.drafts === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="text-[var(--text-body)]">Events</span>
              <span className="font-semibold text-[var(--text-strong)]">
                {summary ? summary.events.publishable : "—"} ready
                {summary && summary.events.drafts > 0 && (
                  <span className="ml-1 font-normal text-[var(--text-muted)]">
                    of {summary.events.drafts} draft
                    {summary.events.drafts === 1 ? "" : "s"}
                  </span>
                )}
              </span>
            </div>

            {missingPhoto.length > 0 && (
              <div className="flex gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-amber-100">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  {missingPhoto.length} draft performer
                  {missingPhoto.length === 1 ? "" : "s"} without a photo will be
                  skipped: {missingPhoto.join(", ")}. Add a photo, then publish
                  again.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              onClick={() => setOpen(false)}
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button
              variant="galaxy"
              className="min-h-11 w-full px-5 sm:min-h-0 sm:w-auto"
              onClick={() => void publish()}
              disabled={publishing || pending === 0}
            >
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Rocket className="h-4 w-4" aria-hidden />
              )}
              {pending > 0
                ? `Publish ${pending} change${pending === 1 ? "" : "s"}`
                : "Nothing to publish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
