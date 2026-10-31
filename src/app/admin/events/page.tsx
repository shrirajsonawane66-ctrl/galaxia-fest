"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
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
import { dayLabel, formatEventTime } from "@/lib/events/format";
import type { EventInput, EventRecord } from "@/lib/events/types";
import { cn } from "@/lib/utils";

// The editor pulls in react-hook-form, zod and the live EventCard preview.
// None of that is needed until the admin actually opens a form.
const EventEditor = dynamic(() => import("./event-editor"), {
  ssr: false,
});

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function AdminEventsPage() {
  const [events, setEvents] = React.useState<EventRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [dayFilter, setDayFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [sortBy, setSortBy] = React.useState<"date" | "name">("date");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<EventRecord | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<EventRecord | null>(null);
  const [bulkDeleting, setBulkDeleting] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const pageSize = 20;

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ events: EventRecord[] }>("/api/admin/events");
      setEvents(data.events);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const days = React.useMemo(
    () => Array.from(new Set(events.map((event) => event.date))).sort(),
    [events]
  );

  const filtered = React.useMemo(() => {
    const list = events.filter((event) => {
      const matchQuery =
        !query ||
        `${event.eventName} ${event.heading} ${event.location} ${event.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchDay = dayFilter === "all" || event.date === dayFilter;
      const matchStatus = statusFilter === "all" || event.status === statusFilter;
      const matchCategory = categoryFilter === "all" || event.category === categoryFilter;
      return matchQuery && matchDay && matchStatus && matchCategory;
    });

    return list.sort((a, b) => {
      if (sortBy === "name") return a.eventName.localeCompare(b.eventName);
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.sortOrder - b.sortOrder;
    });
  }, [events, query, dayFilter, statusFilter, categoryFilter, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allPagedSelected =
    paged.length > 0 && paged.every((event) => selected.has(event.id));

  const refresh = async () => {
    await load();
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const event of paged) {
        if (allPagedSelected) next.delete(event.id);
        else next.add(event.id);
      }
      return next;
    });
  };

  const deleteOne = async (event: EventRecord) => {
    setBulkDeleting(true);
    try {
      await api(`/api/admin/events/${event.id}`, { method: "DELETE" });
      toast.success("Event deleted");
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(event.id);
        return next;
      });
      await refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) => api(`/api/admin/events/${id}`, { method: "DELETE" }))
      );
      toast.success(`${selected.size} event(s) deleted`);
      setSelected(new Set());
      await refresh();
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleStatus = async (event: EventRecord) => {
    const status = event.status === "published" ? "draft" : "published";
    try {
      await api(`/api/admin/events/${event.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(status === "published" ? "Event published" : "Event unpublished");
      await refresh();
    } catch (statusError) {
      toast.error(statusError instanceof Error ? statusError.message : "Status update failed");
    }
  };

  const duplicate = async (event: EventRecord) => {
    const payload: EventInput = {
      heading: event.heading,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      imageUrl: event.imageUrl,
      imageAlt: event.imageAlt,
      eventName: `${event.eventName} (Copy)`,
      location: event.location,
      category: event.category,
      actionLabel: event.actionLabel,
      actionType: event.actionType,
      actionUrl: event.actionUrl,
      status: "draft",
      featured: false,
      sortOrder: event.sortOrder + 1,
    };
    try {
      await api("/api/admin/events", { method: "POST", body: JSON.stringify(payload) });
      toast.success("Event duplicated");
      await refresh();
    } catch (duplicateError) {
      toast.error(duplicateError instanceof Error ? duplicateError.message : "Duplicate failed");
    }
  };

  const move = async (event: EventRecord, direction: -1 | 1) => {
    const sameDay = events
      .filter((item) => item.date === event.date)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sameDay.findIndex((item) => item.id === event.id);
    const swapWith = sameDay[index + direction];
    if (!swapWith) return;

    const orders = [
      { id: event.id, sortOrder: swapWith.sortOrder },
      { id: swapWith.id, sortOrder: event.sortOrder },
    ];

    try {
      await api("/api/admin/events/reorder", {
        method: "POST",
        body: JSON.stringify({ orders }),
      });
      await refresh();
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : "Reorder failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Events</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage the public <span className="text-[var(--text-strong)]">/events</span> schedule. Drafts stay hidden.
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

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search eventsâ€¦"
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm focus:border-[#F4EDE0]/50 focus:outline-none md:min-h-0"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center">
          <select
            value={dayFilter}
            onChange={(event) => {
              setDayFilter(event.target.value);
              setPage(1);
            }}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Filter by day"
          >
            <option value="all" className="bg-[#050816]">All days</option>
            {days.map((day) => (
              <option key={day} value={day} className="bg-[#050816]">
                {dayLabel(day)}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Filter by status"
          >
            <option value="all" className="bg-[#050816]">All status</option>
            <option value="published" className="bg-[#050816]">Published</option>
            <option value="draft" className="bg-[#050816]">Draft</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Filter by category"
          >
            <option value="all" className="bg-[#050816]">All categories</option>
            {Array.from(new Set(events.map((event) => event.category))).map((category) => (
              <option key={category} value={category} className="bg-[#050816]">
                {category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "date" | "name")}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Sort events"
          >
            <option value="date" className="bg-[#050816]">Sort: date</option>
            <option value="name" className="bg-[#050816]">Sort: name</option>
          </select>

          {selected.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 w-full rounded-full border-red-400/30 text-red-300 md:min-h-0 xl:w-auto"
              onClick={deleteSelected}
              disabled={bulkDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size}
            </Button>
          )}
        </div>
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
            <thead className="border-b border-white/10 text-sm text-[var(--text-muted)]">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all events on this page"
                    checked={allPagedSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />
                </th>
                <th className="p-3 text-left">Event</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Time</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[var(--text-muted)]">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                    <span className="mt-2 block text-sm">Loading eventsâ€¦</span>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-[var(--text-muted)]">
                    No events found. Create one to get started.
                  </td>
                </tr>
              ) : (
                paged.map((event) => (
                  <tr key={event.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${event.eventName}`}
                        checked={selected.has(event.id)}
                        onChange={() => toggleSelected(event.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                          {event.imageUrl ? (
                            <Image
                              src={event.imageUrl}
                              alt={event.imageAlt || event.eventName}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <CalendarDays className="m-auto h-4 w-4 text-[var(--text-muted)]" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-[var(--text-strong)]">{event.eventName}</span>
                            {event.featured && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-label="Featured" />}
                          </div>
                          <div className="truncate text-sm text-[var(--text-muted)]">{event.heading}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-sm text-[var(--text-body)]">{formatDate(event.date)}</td>
                    <td className="whitespace-nowrap p-3 text-sm text-[var(--text-body)]">{formatEventTime(event)}</td>
                    <td className="p-3 text-sm text-[var(--text-body)]">{event.location}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-sm text-[var(--text-muted)]">
                        {event.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(event)}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-sm font-medium transition md:min-h-0",
                          event.status === "published"
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/10 text-[var(--text-muted)] hover:bg-white/20"
                        )}
                        aria-label={`Set ${event.eventName} to ${event.status === "published" ? "draft" : "published"}`}
                      >
                        {event.status}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => move(event, -1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Move ${event.eventName} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-[13px] text-[var(--text-muted)]">{event.sortOrder}</span>
                        <button
                          type="button"
                          onClick={() => move(event, 1)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Move ${event.eventName} down`}
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
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Edit ${event.eventName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicate(event)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Duplicate ${event.eventName}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-red-300/70 hover:bg-red-500/15 hover:text-red-200 md:h-8 md:w-8"
                          aria-label={`Delete ${event.eventName}`}
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

      <div className="flex flex-col items-center justify-between gap-3 text-sm text-[var(--text-muted)] sm:flex-row">
        <span>
          {filtered.length} event(s) Â· page {currentPage} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="min-h-11 rounded-full sm:min-h-0"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-11 rounded-full sm:min-h-0"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      {editorOpen && (
        <EventEditor
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          saving={saving}
          uploading={uploading}
          setUploading={setUploading}
          onSaved={async () => {
            setEditorOpen(false);
            setEditing(null);
            await refresh();
          }}
          setSaving={setSaving}
        />
      )}

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              â€œ{deleteTarget?.eventName}â€ will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
              disabled={bulkDeleting}
              onClick={() => deleteTarget && deleteOne(deleteTarget)}
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
