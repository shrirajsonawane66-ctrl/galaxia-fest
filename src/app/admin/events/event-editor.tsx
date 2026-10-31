"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EventCard } from "@/components/ui/card-14";
import { adminApi as api } from "@/lib/admin-api";
import { formatEventTime } from "@/lib/events/format";
import { eventInputSchema } from "@/lib/events/types";
import type { EventInput, EventRecord } from "@/lib/events/types";

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

export default function EventEditor({
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
      <DialogContent className="max-h-[100dvh] overflow-y-auto pb-0 sm:max-h-[92vh] sm:max-w-5xl sm:pb-6">
        <DialogHeader>
          <DialogTitle className="font-sans">{initial ? "Edit event" : "Add event"}</DialogTitle>
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
              <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[var(--text-body)] hover:bg-white/10 sm:min-h-0 sm:w-auto sm:justify-start">
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
                  className="inline-flex min-h-11 items-center gap-1 text-sm text-red-300 hover:text-red-200 sm:min-h-0"
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
              <label className="flex min-h-12 items-center gap-2 pb-2 text-sm text-[var(--text-body)] md:min-h-0 md:items-end">
                <input type="checkbox" {...register("featured")} className="h-4 w-4 rounded border-white/20 bg-white/10" />
                Featured
              </label>
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-2 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#0a0f2b] px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:mt-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-4">
              <Button type="button" variant="outline" className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving || uploading}
                className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {initial ? "Save changes" : "Create event"}
              </Button>
            </div>
          </form>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2 text-sm text-[var(--text-muted)]">Live preview</div>
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
      <span className="mb-1.5 flex items-center justify-between text-sm text-[var(--text-muted)]">
        {label}
        {hint && <span className="normal-case tracking-normal text-[var(--text-muted)]">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[13px] text-red-300">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] md:min-h-0";
