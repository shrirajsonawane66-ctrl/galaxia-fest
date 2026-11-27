"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi as api } from "@/lib/admin-api";
import { formatStartsAt, sortEvents } from "@/lib/events/format";
import { thumbnailForTitle } from "@/lib/events/thumbnails";
import type { EventRecord } from "@/lib/events/types";
import { cn } from "@/lib/utils";

const EventEditor = dynamic(() => import("./event-editor"), { ssr: false });

export default function AdminEventsPage() {
  const [events, setEvents] = React.useState<EventRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [dayFilter, setDayFilter] = React.useState("all");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EventRecord | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<EventRecord | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ events: EventRecord[] }>("/api/admin/events");
      setEvents(sortEvents(data.events));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortEvents(
      events.filter(
        (event) =>
          (!needle || event.title.toLowerCase().includes(needle)) &&
          (dayFilter === "all" || event.day === Number(dayFilter))
      )
    );
  }, [events, query, dayFilter]);

  const togglePublished = async (event: EventRecord) => {
    const status = event.isPublished ? "draft" : "published";
    try {
      await api(`/api/admin/events/${event.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(status === "published" ? "Event published" : "Event unpublished");
      await load();
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error ? toggleError.message : "Status update failed"
      );
    }
  };

  const move = async (event: EventRecord, direction: -1 | 1) => {
    const sameDay = sortEvents(events).filter((item) => item.day === event.day);
    const index = sameDay.findIndex((item) => item.id === event.id);
    const swapWith = sameDay[index + direction];
    if (!swapWith) return;

    try {
      await api("/api/admin/events/reorder", {
        method: "POST",
        body: JSON.stringify({
          orders: [
            { id: event.id, sortOrder: swapWith.sortOrder },
            { id: swapWith.id, sortOrder: event.sortOrder },
          ],
        }),
      });
      await load();
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : "Reorder failed");
    }
  };

  const deleteOne = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/events/${deleteTarget.id}`, { method: "DELETE" });
      toast.success("Event deleted");
      setDeleteTarget(null);
      await load();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">
            Events
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Create, edit, reorder and publish events for the public /events page.
          </p>
        </div>
        <Button
          className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search events…"
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm focus:border-[#F4EDE0]/50 focus:outline-none md:min-h-0"
          />
        </div>
        <select
          value={dayFilter}
          onChange={(event) => setDayFilter(event.target.value)}
          aria-label="Filter by day"
          className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 sm:w-auto"
        >
          <option value="all" className="bg-[#050816]">All days</option>
          <option value="1" className="bg-[#050816]">Day 1</option>
          <option value="2" className="bg-[#050816]">Day 2</option>
        </select>
        <span className="type-small">{filtered.length} event(s)</span>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button size="sm" variant="outline" className="rounded-full" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-white/10 text-[var(--text-muted)]">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Day</th>
                <th className="p-3 text-left">Date & time (IST)</th>
                <th className="p-3 text-left">Rules</th>
                <th className="p-3 text-left">WhatsApp</th>
                <th className="p-3 text-left">Published</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                    <span className="mt-2 block text-sm">Loading events…</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">
                    No events found. Create one to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((event) => (
                  <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                          <Image
                            src={event.imageUrl || thumbnailForTitle(event.title)}
                            alt={event.imageAlt || `${event.title} thumbnail`}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--text-strong)]">
                            {event.title}
                          </div>
                          {event.theme && (
                            <div className="truncate text-[var(--text-muted)]">{event.theme}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{event.day === 1 ? "Day 1" : "Day 2"}</td>
                    <td className="whitespace-nowrap p-3">
                      {formatStartsAt(event.startsAt)}
                    </td>
                    <td className="p-3 text-center">{event.rules.length}</td>
                    <td className="p-3">
                      {event.whatsappUrl ? (
                        <a
                          href={event.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366]"
                        >
                          Yes
                        </a>
                      ) : (
                        <span className="text-[var(--text-muted)]">No</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => togglePublished(event)}
                        aria-label={`${event.isPublished ? "Unpublish" : "Publish"} ${event.title}`}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-sm font-medium transition md:min-h-0",
                          event.isPublished
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/10 text-[var(--text-muted)] hover:bg-white/20"
                        )}
                      >
                        {event.isPublished ? "Published" : "Draft"}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(event, -1)}
                          aria-label={`Move ${event.title} up`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 md:h-8 md:w-8"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-[var(--text-muted)]">
                          {event.sortOrder}
                        </span>
                        <button
                          type="button"
                          onClick={() => move(event, 1)}
                          aria-label={`Move ${event.title} down`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 md:h-8 md:w-8"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(event);
                            setEditorOpen(true);
                          }}
                          aria-label={`Edit ${event.title}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          aria-label={`Delete ${event.title}`}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-red-300/70 hover:bg-red-500/15 hover:text-red-200 md:h-8 md:w-8"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="type-small flex items-center gap-2">
        <CalendarDays className="h-4 w-4" aria-hidden />
        Dates shown in IST. All times are stored in UTC.
      </p>

      {editorOpen && (
        <EventEditor
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          saving={saving}
          setSaving={setSaving}
          onSaved={async () => {
            setEditorOpen(false);
            setEditing(null);
            await load();
          }}
        />
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.title}” will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
              disabled={deleting}
              onClick={deleteOne}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
