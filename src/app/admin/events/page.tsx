"use client";

import * as React from "react";
import Image from "next/image";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventCard } from "@/components/ui/card-14";
import { dayLabel, formatEventTime } from "@/lib/events/format";
import { eventInputSchema } from "@/lib/events/types";
import type { EventInput, EventRecord } from "@/lib/events/types";
import { cn } from "@/lib/utils";

type FormValues = EventInput;

const defaultValues: FormValues = {
  heading: "",
  description: "",
  date: "2025-12-19",
  startTime: "10:00",
  endTime: "11:00",
  imageUrl: "",
  imageAlt: "",
  eventName: "",
  location: "Cosmos Stage",
  category: "Music",
  actionLabel: "Register",
  actionType: "none",
  actionUrl: "",
  status: "draft",
  featured: false,
  sortOrder: 1,
};

const categories = ["Music", "Dance", "Gaming", "Tech", "Workshop", "Comedy", "Art"];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
    issues?: unknown;
  };
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

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
          <h1 className="font-orbitron text-2xl font-black">Events</h1>
          <p className="mt-1 text-sm text-white/50">
            Manage the public <span className="text-cream">/events</span> schedule. Drafts stay hidden.
          </p>
        </div>
        <Button
          className="rounded-full bg-fest-red text-white hover:bg-red-glow"
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search events…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm focus:border-fest-red/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dayFilter}
            onChange={(event) => {
              setDayFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
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
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
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
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
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
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs"
            aria-label="Sort events"
          >
            <option value="date" className="bg-[#050816]">Sort: date</option>
            <option value="name" className="bg-[#050816]">Sort: name</option>
          </select>

          {selected.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-red-400/30 text-red-300"
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
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.18em] text-white/40">
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
                  <td colSpan={9} className="p-10 text-center text-white/40">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-hidden />
                    <span className="mt-2 block text-xs">Loading events…</span>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-white/40">
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
                            <CalendarDays className="m-auto h-4 w-4 text-white/30" aria-hidden />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-medium text-white">{event.eventName}</span>
                            {event.featured && <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" aria-label="Featured" />}
                          </div>
                          <div className="truncate text-xs text-white/40">{event.heading}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-xs text-white/60">{formatDate(event.date)}</td>
                    <td className="whitespace-nowrap p-3 text-xs text-white/60">{formatEventTime(event)}</td>
                    <td className="p-3 text-xs text-white/60">{event.location}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/60">
                        {event.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => toggleStatus(event)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition",
                          event.status === "published"
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/10 text-white/50 hover:bg-white/20"
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
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                          aria-label={`Move ${event.eventName} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-4 text-center text-[11px] text-white/40">{event.sortOrder}</span>
                        <button
                          type="button"
                          onClick={() => move(event, 1)}
                          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
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
                          className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                          aria-label={`Edit ${event.eventName}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicate(event)}
                          className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                          aria-label={`Duplicate ${event.eventName}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(event)}
                          className="rounded p-1.5 text-red-300/70 hover:bg-red-500/15 hover:text-red-200"
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

      <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/40 sm:flex-row">
        <span>
          {filtered.length} event(s) · page {currentPage} of {pageCount}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>

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

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
            <DialogDescription>
              “{deleteTarget?.eventName}” will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-full bg-fest-red text-white hover:bg-red-glow"
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

function EventEditor({
  open,
  onOpenChange,
  initial,
  saving,
  uploading,
  setUploading,
  setSaving,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EventRecord | null;
  saving: boolean;
  uploading: boolean;
  setUploading: (value: boolean) => void;
  setSaving: (value: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(eventInputSchema) as Resolver<FormValues>,
    defaultValues,
  });

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      reset({
        heading: initial.heading,
        description: initial.description,
        date: initial.date,
        startTime: initial.startTime,
        endTime: initial.endTime || "",
        imageUrl: initial.imageUrl || "",
        imageAlt: initial.imageAlt || "",
        eventName: initial.eventName,
        location: initial.location,
        category: initial.category,
        actionLabel: initial.actionLabel || "",
        actionType: initial.actionType,
        actionUrl: initial.actionUrl || "",
        status: initial.status,
        featured: initial.featured,
        sortOrder: initial.sortOrder,
      });
    } else {
      reset(defaultValues);
    }
  }, [open, initial, reset]);

  const values = watch();

  const submit = handleSubmit(
    async (data) => {
      setSaving(true);
      try {
        const payload = { ...data };
        if (initial) {
          await api(`/api/admin/events/${initial.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          toast.success("Event updated");
        } else {
          await api("/api/admin/events", {
            method: "POST",
            body: JSON.stringify(payload),
          });
          toast.success("Event created");
        }
        await onSaved();
      } catch (submitError) {
        toast.error(submitError instanceof Error ? submitError.message : "Save failed");
      } finally {
        setSaving(false);
      }
    },
    (formErrors) => {
      const first = Object.values(formErrors)[0];
      if (first && "message" in first && typeof first.message === "string") {
        toast.error(first.message);
      }
    }
  );

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("imageUrl", { message: "Image must be 2MB or smaller" });
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/events/upload", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Upload failed");
      }
      setValue("imageUrl", payload.url, { shouldValidate: true });
      toast.success("Image uploaded");
    } catch (uploadError) {
      toast.error(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const previewDate = new Date(`${values.date || "2025-12-19"}T00:00:00+05:30`);
  const previewTime = values.endTime
    ? `${formatEventTime({ startTime: values.startTime, endTime: values.endTime })}`
    : formatEventTime({ startTime: values.startTime });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="font-orbitron">{initial ? "Edit event" : "Add event"}</DialogTitle>
          <DialogDescription>
            Every field updates the public EventCard live. Drafts are hidden from /events.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Event name" error={errors.eventName?.message}>
                <input {...register("eventName")} className={inputClass} placeholder="Opening Ceremony" />
              </Field>
              <Field label="Card heading" error={errors.heading?.message}>
                <input {...register("heading")} className={inputClass} placeholder="Day 1 · Main Stage" />
              </Field>
            </div>

            <Field
              label="Description"
              error={errors.description?.message}
              hint={`${values.description?.length || 0}/160`}
            >
              <textarea
                {...register("description")}
                rows={3}
                maxLength={160}
                className={inputClass}
                placeholder="One-line teaser for the card."
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Date" error={errors.date?.message}>
                <input type="date" {...register("date")} className={inputClass} />
              </Field>
              <Field label="Start time" error={errors.startTime?.message}>
                <input type="time" {...register("startTime")} className={inputClass} />
              </Field>
              <Field label="End time (optional)" error={errors.endTime?.message}>
                <input type="time" {...register("endTime")} className={inputClass} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location / stage" error={errors.location?.message}>
                <input {...register("location")} className={inputClass} placeholder="Cosmos Stage" />
              </Field>
              <Field label="Category" error={errors.category?.message}>
                <select {...register("category")} className={inputClass}>
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-[#050816]">
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Image URL" error={errors.imageUrl?.message}>
                <input {...register("imageUrl")} className={inputClass} placeholder="https://…" />
              </Field>
              <Field label="Image alt text" error={errors.imageAlt?.message}>
                <input {...register("imageAlt")} className={inputClass} placeholder="Describe the image" />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Upload image (max 2MB)
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="sr-only" />
              </label>
              {values.imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setValue("imageUrl", "");
                    setValue("imageAlt", "");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"
                >
                  <X className="h-3.5 w-3.5" /> Remove image
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Action type" error={errors.actionType?.message}>
                <select {...register("actionType")} className={inputClass}>
                  <option value="none" className="bg-[#050816]">None</option>
                  <option value="link" className="bg-[#050816]">External link</option>
                  <option value="calendar" className="bg-[#050816]">Add to calendar</option>
                </select>
              </Field>
              <Field label="Action label" error={errors.actionLabel?.message}>
                <input {...register("actionLabel")} className={inputClass} placeholder="Register" />
              </Field>
              <Field label="Action URL" error={errors.actionUrl?.message}>
                <input {...register("actionUrl")} className={inputClass} placeholder="https://…" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Status">
                <select {...register("status")} className={inputClass}>
                  <option value="draft" className="bg-[#050816]">Draft</option>
                  <option value="published" className="bg-[#050816]">Published</option>
                </select>
              </Field>
              <Field label="Sort order" error={errors.sortOrder?.message}>
                <input
                  type="number"
                  min={0}
                  max={9999}
                  {...register("sortOrder", { valueAsNumber: true })}
                  className={inputClass}
                />
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm text-white/70">
                <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-white/20 bg-white/10" />
                Featured
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || uploading}
                className="rounded-full bg-fest-red text-white hover:bg-red-glow"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {initial ? "Save changes" : "Create event"}
              </Button>
            </div>
          </form>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/40">Live preview</div>
            <EventCard
              heading={values.heading || "Day 1 · Main Stage"}
              description={values.description || "Your event teaser appears here."}
              date={previewDate}
              imageUrl={values.imageUrl}
              imageAlt={values.imageAlt || values.eventName}
              eventName={values.eventName || "Event name"}
              location={values.location || "Venue"}
              time={previewTime}
              actionLabel={values.actionType === "none" ? undefined : values.actionLabel || "Action"}
              onActionClick={values.actionType === "none" ? undefined : () => undefined}
              featured={values.featured}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-white/45">
        {label}
        {hint && <span className="normal-case tracking-normal text-white/30">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-red-300">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-fest-red/50 focus:outline-none focus:ring-1 focus:ring-fest-red/30";
