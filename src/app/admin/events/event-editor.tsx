"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi as api } from "@/lib/admin-api";
import {
  istDateTimeLocalToUtc,
  utcToIstDateTimeLocal,
} from "@/lib/events/format";
import { EVENT_THUMBNAILS, thumbnailForTitle } from "@/lib/events/thumbnails";
import {
  cleanedRules,
  eventInputSchema,
  eventToInput,
  registrationUrlSchema,
  whatsappUrlSchema,
} from "@/lib/events/types";
import type { EventRecord } from "@/lib/events/types";

type FormValues = import("zod").infer<typeof eventInputSchema>;

const defaults: FormValues = {
  title: "",
  day: 1,
  theme: "",
  startsAt: null,
  rules: [],
  whatsappUrl: null,
  formUrl: null,
  isPublished: false,
  sortOrder: 0,
};

export default function EventEditor({
  open,
  onOpenChange,
  initial,
  saving,
  setSaving,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: EventRecord | null;
  saving: boolean;
  setSaving: (value: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(eventInputSchema),
    defaultValues: defaults,
  });

  const [rules, setRules] = React.useState<string[]>([]);
  const [startsAtLocal, setStartsAtLocal] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [formLink, setFormLink] = React.useState("");
  const [customThumbnail, setCustomThumbnail] = React.useState<string | null>(null);
  const title = watch("title");

  React.useEffect(() => {
    if (!open) return;
    if (initial) {
      const input = eventToInput(initial);
      reset({
        title: input.title,
        day: input.day,
        theme: input.theme,
        startsAt: input.startsAt,
        rules: input.rules,
        whatsappUrl: input.whatsappUrl,
        formUrl: input.formUrl,
        isPublished: input.isPublished,
        sortOrder: input.sortOrder,
        imageUrl: input.imageUrl || "",
        imageAlt: input.imageAlt || "",
      });
      setRules(input.rules);
      setStartsAtLocal(utcToIstDateTimeLocal(initial.startsAt));
      setWhatsapp(input.whatsappUrl || "");
      setFormLink(input.formUrl || "");
      setCustomThumbnail(initial.imageUrl || null);
    } else {
      reset(defaults);
      setRules([]);
      setStartsAtLocal("");
      setWhatsapp("");
      setFormLink("");
      setCustomThumbnail(null);
    }
  }, [open, initial, reset]);

  const thumbnail = customThumbnail || thumbnailForTitle(title);

  const updateRule = (index: number, value: string) => {
    setRules((current) => current.map((rule, i) => (i === index ? value : rule)));
  };
  const moveRule = (index: number, direction: -1 | 1) => {
    setRules((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const submit = handleSubmit(async (data) => {
    const startsAt = startsAtLocal ? istDateTimeLocalToUtc(startsAtLocal) : null;
    if (startsAtLocal && !startsAt) {
      setError("startsAt", { message: "Enter a valid date and time in IST" });
      return;
    }
    const cleanRules = cleanedRules(rules);
    const tooLong = cleanRules.find((rule) => rule.length > 2000);
    if (tooLong) {
      toast.error("Each rule must be under 2000 characters");
      return;
    }

    const trimmedWhatsapp = whatsapp.trim();
    const whatsappUrl = trimmedWhatsapp || null;
    if (whatsappUrl) {
      const parsedWhatsapp = whatsappUrlSchema.safeParse(whatsappUrl);
      if (!parsedWhatsapp.success) {
        toast.error(parsedWhatsapp.error.issues[0]?.message ?? "Invalid WhatsApp link");
        return;
      }
    }

    const trimmedForm = formLink.trim();
    const formUrl = trimmedForm || null;
    if (formUrl) {
      const parsedForm = registrationUrlSchema.safeParse(formUrl);
      if (!parsedForm.success) {
        toast.error(parsedForm.error.issues[0]?.message ?? "Invalid registration link");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...data,
        startsAt,
        rules: cleanRules,
        whatsappUrl,
        formUrl,
        imageUrl: thumbnail,
        imageAlt: `${data.title} thumbnail`,
        eventName: data.title,
        heading: data.title,
        description: data.theme || "",
        location: "TBA",
        category: "General",
        actionType: "none" as const,
        status: data.isPublished ? ("published" as const) : ("draft" as const),
      };

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
      toast.error(
        submitError instanceof Error ? submitError.message : "Save failed"
      );
    } finally {
      setSaving(false);
    }
  }, (formErrors) => {
    const first = Object.values(formErrors)[0];
    if (first && "message" in first && typeof first.message === "string") {
      toast.error(first.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto pb-0 sm:max-h-[92vh] sm:max-w-4xl sm:pb-6">
        <DialogHeader>
          <DialogTitle className="font-display">
            {initial ? "Edit event" : "Add event"}
          </DialogTitle>
          <DialogDescription>
            Times are entered in IST (UTC+05:30) and stored in UTC. Leave the
            date empty for “Date to be announced”. Drafts stay hidden publicly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="Title" error={errors.title?.message} hint={`${title.length}/80`}>
              <input
                {...register("title")}
                maxLength={80}
                className={inputClass}
                placeholder="Elocution"
              />
            </Field>
            <Field label="Day" error={errors.day?.message}>
              <select {...register("day", { valueAsNumber: true })} className={inputClass}>
                <option value={1} className="bg-[#050816]">Day 1</option>
                <option value={2} className="bg-[#050816]">Day 2</option>
              </select>
            </Field>
          </div>

          <Field label="Theme (optional)" error={errors.theme?.message}>
            <input
              {...register("theme")}
              maxLength={120}
              className={inputClass}
              placeholder="Speak to the Stars"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date & time (IST)" hint="Leave empty for TBA">
              <input
                type="datetime-local"
                value={startsAtLocal}
                onChange={(event) => setStartsAtLocal(event.target.value)}
                className={inputClass}
              />
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
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-muted)]">Rules</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 rounded-full sm:min-h-0"
                onClick={() => setRules((current) => [...current, ""])}
              >
                <Plus className="h-3.5 w-3.5" /> Add rule
              </Button>
            </div>
            <div className="space-y-2">
              {rules.length === 0 && (
                <p className="type-small">No rules yet. Add one if needed.</p>
              )}
              {rules.map((rule, index) => (
                <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <span className="pt-2 type-small w-6 shrink-0">{index + 1}.</span>
                  <textarea
                    value={rule}
                    onChange={(event) => updateRule(index, event.target.value)}
                    rows={2}
                    className={`${inputClass} flex-1`}
                    placeholder="One rule per row"
                  />
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => moveRule(index, -1)}
                      disabled={index === 0}
                      aria-label={`Move rule ${index + 1} up`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 disabled:opacity-40 md:h-9 md:w-9"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRule(index, 1)}
                      disabled={index === rules.length - 1}
                      aria-label={`Move rule ${index + 1} down`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 disabled:opacity-40 md:h-9 md:w-9"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRules((current) => current.filter((_, i) => i !== index))}
                      aria-label={`Delete rule ${index + 1}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded text-red-300/80 hover:bg-red-500/15 md:h-9 md:w-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Field label="WhatsApp group link (optional)">
            <input
              type="url"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              className={inputClass}
              placeholder="https://chat.whatsapp.com/… or https://wa.me/…"
            />
          </Field>

          <Field label="Registration form link (optional)">
            <input
              type="url"
              value={formLink}
              onChange={(event) => setFormLink(event.target.value)}
              className={inputClass}
              placeholder="https://ves-admin.learnqoch.com/eventform/…"
            />
          </Field>

          <Field label="Thumbnail" hint="Chosen from images already in /public">
            <select
              value={thumbnail}
              onChange={(event) => setCustomThumbnail(event.target.value)}
              className={inputClass}
            >
              <option value={thumbnailForTitle(title)} className="bg-[#050816]">
                Auto ({thumbnailForTitle(title)})
              </option>
              {EVENT_THUMBNAILS.map((item) => (
                <option key={item.src} value={item.src} className="bg-[#050816]">
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              {...register("isPublished")}
              className="h-4 w-4 rounded border-white/20 bg-white/10"
            />
            Published (visible on the public Events page)
          </label>

          <div className="sticky bottom-0 z-10 -mx-6 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#0a0f2b] px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-4">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {initial ? "Save changes" : "Create event"}
            </Button>
          </div>
        </form>
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
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
        {label}
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-[13px] text-red-300">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none md:min-h-0";
