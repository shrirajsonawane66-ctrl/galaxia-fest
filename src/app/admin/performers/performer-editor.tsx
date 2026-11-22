"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi as api } from "@/lib/admin-api";
import { PHOTO_HINT } from "@/lib/performers-hero";
import { performerInputSchema } from "@/lib/performers/types";
import type { PerformerInput, PerformerRecord } from "@/lib/performers/types";
import { cn } from "@/lib/utils";
import { uploadImage, validateFile } from "./upload";
import { Field, Switch, initials, inputClass } from "./ui";

type FormValues = PerformerInput;

const maxYear = new Date().getFullYear() + 1;
const LINEUP_HINT = "Shown in the lineup list under the photo band.";

function makeDefaultValues(latestYear: number): FormValues {
  return {
    name: "",
    year: latestYear,
    role: "Artist",
    image: "",
    status: "draft",
  };
}

export default function PerformerEditor({
  open,
  onOpenChange,
  initial,
  latestYear,
  roles,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PerformerRecord | null;
  latestYear: number;
  roles: string[];
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
    resolver: zodResolver(performerInputSchema) as Resolver<FormValues>,
    defaultValues: makeDefaultValues(latestYear),
  });

  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [photoProgress, setPhotoProgress] = React.useState(0);
  const [photoDrag, setPhotoDrag] = React.useState(false);
  const [previewFailed, setPreviewFailed] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPreviewFailed(false);
    setUploading(false);
    setPhotoProgress(0);
    if (initial) {
      reset({
        name: initial.name,
        year: initial.year,
        role: initial.role,
        image: initial.image,
        status: initial.status,
      });
    } else {
      reset(makeDefaultValues(latestYear));
    }
  }, [open, initial, latestYear, reset]);

  const values = watch();

  React.useEffect(() => {
    setPreviewFailed(false);
  }, [values.image]);

  const submit = handleSubmit(
    async (data) => {
      setSaving(true);
      try {
        if (initial) {
          await api(`/api/admin/performers/${initial.id}`, {
            method: "PUT",
            body: JSON.stringify(data),
          });
          toast.success("Performer updated");
        } else {
          await api("/api/admin/performers", {
            method: "POST",
            body: JSON.stringify(data),
          });
          toast.success("Performer created");
        }
        await onSaved();
      } catch (submitError) {
        toast.error(
          submitError instanceof Error ? submitError.message : "Save failed"
        );
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

  const uploadFile = async (file: File) => {
    const invalid = validateFile(file);
    if (invalid) {
      setError("image", { message: invalid });
      return;
    }

    setUploading(true);
    setPhotoProgress(0);
    try {
      const url = await uploadImage(
        file,
        values.name || "performer",
        setPhotoProgress
      );
      setValue("image", url, { shouldValidate: true });
      toast.success("Photo uploaded");
    } catch (uploadError) {
      toast.error(
        uploadError instanceof Error ? uploadError.message : "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  };

  const previewYear =
    Number.isFinite(values.year) && values.year >= 2000
      ? values.year
      : latestYear;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[100dvh] overflow-y-auto pb-0 sm:max-h-[92vh] sm:max-w-5xl sm:pb-6">
        <DialogHeader>
          <DialogTitle className="font-sans">
            {initial ? "Edit performer" : "Add performer"}
          </DialogTitle>
          <DialogDescription>
            Upload a portrait photo, then fill in the details shown in the
            homepage lineup list. Drafts stay hidden until published.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_300px]">
          <form onSubmit={submit} className="space-y-4">
            <Field
              label="Name"
              hint={LINEUP_HINT}
              error={errors.name?.message}
            >
              <input
                {...register("name")}
                className={inputClass}
                placeholder="Performer name"
                maxLength={60}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Year"
                hint={LINEUP_HINT}
                error={errors.year?.message}
              >
                <input
                  type="number"
                  min={2000}
                  max={maxYear}
                  {...register("year", { valueAsNumber: true })}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Role"
                hint={LINEUP_HINT}
                error={errors.role?.message}
              >
                <input
                  {...register("role")}
                  className={inputClass}
                  placeholder="Headliner, DJ, Band…"
                  list="performer-role-suggestions"
                  maxLength={40}
                />
                <datalist id="performer-role-suggestions">
                  {roles.map((role) => (
                    <option key={role} value={role} />
                  ))}
                </datalist>
              </Field>
            </div>

            <div>
              <span className="mb-1.5 flex items-center justify-between text-sm text-[var(--text-muted)]">
                Photo
                {errors.image && (
                  <span className="normal-case tracking-normal text-red-300">
                    {errors.image.message}
                  </span>
                )}
              </span>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setPhotoDrag(true);
                  }}
                  onDragLeave={() => setPhotoDrag(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setPhotoDrag(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                  className={cn(
                    "relative aspect-[3/4] w-full max-w-[180px] shrink-0 overflow-hidden rounded-xl border bg-[#0a1f5c]",
                    photoDrag ? "border-[#FF3B4B]/70" : "border-white/10"
                  )}
                >
                  {values.image && !previewFailed ? (
                    <img
                      src={values.image}
                      alt=""
                      onError={() => setPreviewFailed(true)}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                      <ImagePlus
                        className="h-6 w-6 text-[var(--text-strong)]"
                        aria-hidden
                      />
                      <span className="text-base font-semibold text-[var(--text-strong)]">
                        {initials(values.name || "Performer")}
                      </span>
                    </div>
                  )}

                  {/* 3:4 crop guide with the upper-half face zone marked. */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-[5%] rounded-lg border border-dashed border-white/55" />
                    <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#F4EDE0]/70" />
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[11px] text-white">
                      3:4
                    </span>
                    <span className="absolute inset-x-1.5 top-[53%] rounded bg-black/45 px-1 py-0.5 text-center text-[10px] leading-tight text-white">
                      Face in the upper half
                    </span>
                  </div>

                  {uploading && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1.5">
                      <div className="h-1 overflow-hidden rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-[width] duration-200"
                          style={{ width: `${photoProgress}%` }}
                        />
                      </div>
                      <div className="mt-1 text-center text-[11px] text-white">
                        {photoProgress}%
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[var(--text-body)] hover:bg-white/10 sm:min-h-0 sm:w-auto sm:justify-start">
                      {uploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      {values.image ? "Replace photo" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = "";
                          if (file) void uploadFile(file);
                        }}
                        className="sr-only"
                      />
                    </label>
                    {values.image && (
                      <button
                        type="button"
                        onClick={() =>
                          setValue("image", "", { shouldValidate: true })
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center gap-1 text-sm text-red-300 hover:text-red-200 sm:min-h-0 sm:w-auto sm:justify-start"
                      >
                        <X className="h-3.5 w-3.5" /> Remove photo
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
                    {PHOTO_HINT}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="text-sm text-[var(--text-body)]">Published</div>
                <div className="text-[13px] text-[var(--text-muted)]">
                  Only published performers appear on the homepage.
                </div>
              </div>
              <Switch
                checked={values.status === "published"}
                label="Publish performer"
                onChange={(next) =>
                  setValue("status", next ? "published" : "draft", {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 mt-2 flex flex-col-reverse gap-2 border-t border-white/10 bg-[#0a0f2b] px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:static sm:mx-0 sm:mt-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0 sm:pb-4">
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
                disabled={saving || uploading}
                className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {initial ? "Save changes" : "Create performer"}
              </Button>
            </div>
          </form>

          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="mb-2 text-sm text-[var(--text-muted)]">
              Photo preview · 3:4
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="type-h3 text-lg text-[var(--text-strong)]">
                {values.name || "Performer name"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {values.role || "Artist"} · {previewYear}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-muted)]">
                The name and role appear in the lineup list under the photo
                band. The photo itself is cropped to 3:4 inside the curved row.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
