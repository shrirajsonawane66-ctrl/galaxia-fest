"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
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
import { TiltedGridHero } from "@/components/ui/tilted-grid-hero";
import { adminApi as api } from "@/lib/admin-api";
import {
  HERO_PROPS,
  PHOTO_HINT,
  SLICES_LIGHT,
  optimizedSrc,
} from "@/lib/performers-hero";
import type { PerformerInput, PerformerRecord } from "@/lib/performers/types";
import { cn } from "@/lib/utils";
import { MAX_FILES, uploadDraft, uploadImage, validateFile } from "./upload";
import type { UploadTask } from "./upload";
import { Switch, initials } from "./ui";

// The editor brings in react-hook-form, zod and the upload widgets. Load it the
// first time an admin opens a form instead of on every visit to the list.
const PerformerEditor = dynamic(() => import("./performer-editor"), {
  ssr: false,
});

const PAGE_SIZE = 20;

function Thumb({
  performer,
  className,
}: {
  performer: PerformerRecord;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [performer.image]);

  return (
    <div
      className={cn(
        "relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-lg bg-[#0a1f5c]",
        className
      )}
    >
      {performer.image && !failed ? (
        <img
          src={performer.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <span className="flex h-full items-center justify-center font-display text-sm text-[var(--text-strong)]">
          {initials(performer.name)}
        </span>
      )}
    </div>
  );
}

function PreviewSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
      <Switch checked={checked} onChange={onChange} label={label} />
      <span className="text-sm text-[var(--text-body)]">{label}</span>
    </div>
  );
}

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="alertdialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPerformersPage() {
  const [performers, setPerformers] = React.useState<PerformerRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState("all");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<PerformerRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PerformerRecord | null>(
    null
  );
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [movingId, setMovingId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);
  // New uploads are drafts, so show them in the preview straight away.
  const [includeDrafts, setIncludeDrafts] = React.useState(true);
  const [previewPaused, setPreviewPaused] = React.useState(false);
  const [uploads, setUploads] = React.useState<UploadTask[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const [justUploaded, setJustUploaded] = React.useState<Set<string>>(new Set());
  const [replacingId, setReplacingId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const replaceTargetRef = React.useRef<PerformerRecord | null>(null);

  const load = React.useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const data = await api<{ performers: PerformerRecord[] }>(
        "/api/admin/performers"
      );
      setPerformers(data.performers);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load performers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(true);
  }, [load]);

  const refresh = React.useCallback(async () => {
    await load(false);
  }, [load]);

  const years = React.useMemo(
    () =>
      Array.from(new Set(performers.map((performer) => performer.year))).sort(
        (a, b) => b - a
      ),
    [performers]
  );
  const roles = React.useMemo(
    () =>
      Array.from(new Set(performers.map((performer) => performer.role))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [performers]
  );
  const latestYear = React.useMemo(
    () =>
      performers.length
        ? Math.max(...performers.map((performer) => performer.year))
        : new Date().getFullYear(),
    [performers]
  );
  const publishedCount = performers.filter(
    (performer) => performer.status === "published"
  ).length;

  const ordered = React.useMemo(
    () =>
      [...performers].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder ||
          b.year - a.year ||
          a.name.localeCompare(b.name)
      ),
    [performers]
  );

  const previewImages = React.useMemo(
    () =>
      ordered
        .filter(
          (performer) =>
            performer.image && (includeDrafts || performer.status === "published")
        )
        .map((performer) => ({
          src: optimizedSrc(performer.image),
          alt: performer.name,
        })),
    [ordered, includeDrafts]
  );

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return ordered.filter((performer) => {
      const matchQuery = !needle || performer.name.toLowerCase().includes(needle);
      const matchYear =
        yearFilter === "all" || String(performer.year) === yearFilter;
      const matchRole = roleFilter === "all" || performer.role === roleFilter;
      const matchStatus =
        statusFilter === "all" || performer.status === statusFilter;
      return matchQuery && matchYear && matchRole && matchStatus;
    });
  }, [ordered, query, yearFilter, roleFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const allPagedSelected =
    paged.length > 0 && paged.every((performer) => selected.has(performer.id));

  const toggleSelected = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      for (const performer of paged) {
        if (allPagedSelected) next.delete(performer.id);
        else next.add(performer.id);
      }
      return next;
    });
  };

  const handleFiles = async (incoming: FileList | File[]) => {
    const files = Array.from(incoming);
    if (files.length === 0) return;
    if (files.length > MAX_FILES) {
      toast.error(`Upload ${MAX_FILES} photos or fewer at a time.`);
    }
    const batch = files.slice(0, MAX_FILES);
    const tasks: UploadTask[] = batch.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      progress: 0,
      status: "queued",
    }));
    setUploads(tasks);

    const createdIds: string[] = [];
    let failed = 0;

    for (let index = 0; index < batch.length; index += 1) {
      const file = batch[index];
      const task = tasks[index];
      const invalid = validateFile(file);
      if (invalid) {
        failed += 1;
        setUploads((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? { ...item, status: "error", error: invalid }
              : item
          )
        );
        continue;
      }

      setUploads((previous) =>
        previous.map((item) =>
          item.id === task.id ? { ...item, status: "uploading" } : item
        )
      );

      try {
        const created = await uploadDraft(file, (percent) => {
          setUploads((previous) =>
            previous.map((item) =>
              item.id === task.id ? { ...item, progress: percent } : item
            )
          );
        });
        createdIds.push(created.id);
        setUploads((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? { ...item, status: "done", progress: 100 }
              : item
          )
        );
      } catch (uploadError) {
        failed += 1;
        setUploads((previous) =>
          previous.map((item) =>
            item.id === task.id
              ? {
                  ...item,
                  status: "error",
                  error:
                    uploadError instanceof Error
                      ? uploadError.message
                      : "Upload failed.",
                }
              : item
          )
        );
      }
    }

    if (createdIds.length > 0) {
      setJustUploaded(new Set(createdIds));
      toast.success(
        `${createdIds.length} draft${createdIds.length === 1 ? "" : "s"} added. Fill in the details, then publish.`
      );
      await refresh();
    }
    if (failed > 0) {
      toast.error(`${failed} photo${failed === 1 ? "" : "s"} could not be uploaded.`);
    }
  };

  const startReplace = (performer: PerformerRecord) => {
    replaceTargetRef.current = performer;
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const target = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (!file || !target) return;

    const invalid = validateFile(file);
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setReplacingId(target.id);
    try {
      const image = await uploadImage(file, target.name);
      await api(`/api/admin/performers/${target.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: target.name,
          year: target.year,
          role: target.role,
          image,
          status: target.status,
        }),
      });
      toast.success("Photo replaced");
      await refresh();
    } catch (replaceError) {
      toast.error(
        replaceError instanceof Error ? replaceError.message : "Replace failed"
      );
    } finally {
      setReplacingId(null);
    }
  };

  const deleteOne = async (performer: PerformerRecord) => {
    setDeleting(true);
    try {
      await api(`/api/admin/performers/${performer.id}`, { method: "DELETE" });
      toast.success("Performer deleted");
      setDeleteTarget(null);
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(performer.id);
        return next;
      });
      await refresh();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Delete failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    try {
      const result = await api<{ deleted: number }>(
        "/api/admin/performers/bulk-delete",
        {
          method: "POST",
          body: JSON.stringify({ ids: Array.from(selected) }),
        }
      );
      toast.success(`${result.deleted} performer(s) deleted`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      await refresh();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error ? deleteError.message : "Bulk delete failed"
      );
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (performer: PerformerRecord) => {
    const status = performer.status === "published" ? "draft" : "published";
    try {
      await api(`/api/admin/performers/${performer.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(
        status === "published" ? "Performer published" : "Performer unpublished"
      );
      await refresh();
    } catch (statusError) {
      toast.error(
        statusError instanceof Error
          ? statusError.message
          : "Status update failed"
      );
    }
  };

  const setBulkStatus = async (status: "draft" | "published") => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await api("/api/admin/performers/bulk-status", {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selected), status }),
      });
      toast.success(
        status === "published"
          ? `${selected.size} performer(s) published`
          : `${selected.size} performer(s) unpublished`
      );
      setSelected(new Set());
      await refresh();
    } catch (statusError) {
      toast.error(
        statusError instanceof Error ? statusError.message : "Bulk update failed"
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const duplicate = async (performer: PerformerRecord) => {
    const copyName = `${performer.name.slice(0, 53)} (Copy)`;
    const payload: PerformerInput = {
      name: copyName,
      year: performer.year,
      role: performer.role,
      image: performer.image,
      status: "draft",
    };

    try {
      await api("/api/admin/performers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast.success("Performer duplicated as a draft");
      await refresh();
    } catch (duplicateError) {
      toast.error(
        duplicateError instanceof Error
          ? duplicateError.message
          : "Duplicate failed"
      );
    }
  };

  const move = async (performer: PerformerRecord, direction: -1 | 1) => {
    const index = ordered.findIndex((item) => item.id === performer.id);
    const swapWith = ordered[index + direction];
    if (!swapWith) return;

    const next = [...ordered];
    next[index] = swapWith;
    next[index + direction] = performer;

    setMovingId(performer.id);
    try {
      await api("/api/admin/performers/reorder", {
        method: "POST",
        body: JSON.stringify({ ids: next.map((item) => item.id) }),
      });
      toast.success("Order updated");
      await refresh();
    } catch (moveError) {
      toast.error(
        moveError instanceof Error ? moveError.message : "Reorder failed"
      );
    } finally {
      setMovingId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">
            Performers
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Manage the curved photo band and the lineup list on the homepage.
          </p>
        </div>
        <Button
          className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Performer
        </Button>
      </div>

      {!loading && publishedCount < 6 && (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          The curved gallery looks best with 6 or more published photos. Right now{" "}
          {publishedCount} are published.
        </div>
      )}

      {/* Live effect preview — the exact component and settings used at home. */}
      <section className="rounded-2xl border border-white/10 bg-[#06123A] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--text-strong)]">
              Curved gallery preview
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              This is the exact band shown on the homepage, using the current
              photos and order.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewSwitch
              checked={includeDrafts}
              onChange={setIncludeDrafts}
              label="Include drafts in preview"
            />
            <PreviewSwitch
              checked={previewPaused}
              onChange={setPreviewPaused}
              label="Pause animation"
            />
          </div>
        </div>

        <div className="mt-4 h-[220px] overflow-hidden rounded-xl border border-white/10 bg-[#06123A] sm:h-[300px]">
          {previewImages.length > 0 ? (
            <TiltedGridHero
              images={previewImages}
              {...HERO_PROPS}
              slices={SLICES_LIGHT}
              paused={previewPaused}
              className="h-[220px] w-full sm:h-[300px]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--text-muted)]">
              <span>No photos yet.</span>
              <span>
                Drop photos into the box below — they appear here immediately,
                even before you publish them.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Multi-photo upload */}
      <section>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (event.dataTransfer.files?.length) {
              void handleFiles(event.dataTransfer.files);
            }
          }}
          className={cn(
            "cursor-pointer rounded-2xl border border-dashed p-5 transition sm:p-8",
            dragActive
              ? "border-[#FF3B4B]/60 bg-[#FF3B4B]/10"
              : "border-white/15 bg-white/[0.03]"
          )}
          onClick={(event) => {
            // The whole zone is a tap target on phones; ignore clicks that land
            // on the explicit button or the upload-progress list.
            const target = event.target as HTMLElement;
            if (target.closest("button, a, input, label, ul")) return;
            fileInputRef.current?.click();
          }}
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <ImagePlus className="h-5 w-5 text-[var(--text-strong)]" />
            </span>
            <div>
              <p className="text-base font-medium text-[var(--text-strong)]">
                Drop photos here, or choose files
              </p>
              <p className="mx-auto mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                {PHOTO_HINT}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Choose photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files?.length) {
                  void handleFiles(event.target.files);
                }
                event.target.value = "";
              }}
            />
          </div>

          {uploads.length > 0 && (
            <ul className="mx-auto mt-5 max-w-2xl space-y-2 text-left">
              {uploads.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-[var(--text-body)]">
                      {task.name}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[13px]",
                        task.status === "error"
                          ? "text-red-300"
                          : task.status === "done"
                            ? "text-emerald-300"
                            : "text-[var(--text-muted)]"
                      )}
                    >
                      {task.status === "error"
                        ? task.error
                        : task.status === "done"
                          ? "Uploaded"
                          : task.status === "queued"
                            ? "Queued"
                            : `${task.progress}%`}
                    </span>
                  </div>
                  {task.status !== "error" && (
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search performers…"
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm focus:border-[#F4EDE0]/50 focus:outline-none md:min-h-0"
          />
        </div>

        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:flex-wrap xl:items-center">
          <select
            value={yearFilter}
            onChange={(event) => {
              setYearFilter(event.target.value);
              setPage(1);
            }}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Filter by year"
          >
            <option value="all" className="bg-[#050816]">
              All years
            </option>
            {years.map((year) => (
              <option key={year} value={String(year)} className="bg-[#050816]">
                {year}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm md:min-h-0 xl:w-auto"
            aria-label="Filter by role"
          >
            <option value="all" className="bg-[#050816]">
              All roles
            </option>
            {roles.map((role) => (
              <option key={role} value={role} className="bg-[#050816]">
                {role}
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
            <option value="all" className="bg-[#050816]">
              All status
            </option>
            <option value="published" className="bg-[#050816]">
              Published
            </option>
            <option value="draft" className="bg-[#050816]">
              Draft
            </option>
          </select>

          {selected.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 w-full rounded-full md:min-h-0 xl:w-auto"
                onClick={() => void setBulkStatus("published")}
                disabled={bulkBusy || deleting}
              >
                <Check className="h-3.5 w-3.5" /> Publish {selected.size}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 w-full rounded-full md:min-h-0 xl:w-auto"
                onClick={() => void setBulkStatus("draft")}
                disabled={bulkBusy || deleting}
              >
                <X className="h-3.5 w-3.5" /> Unpublish {selected.size}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="min-h-11 w-full rounded-full border-red-400/30 text-red-300 md:min-h-0 xl:w-auto"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete {selected.size}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span>{error}</span>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => void load(true)}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-white/10 text-sm text-[var(--text-muted)]">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all performers on this page"
                    checked={allPagedSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-white/20 bg-white/10"
                  />
                </th>
                <th className="p-3 text-left">Order</th>
                <th className="p-3 text-left">Performer</th>
                <th className="p-3 text-left">Year</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-white/5">
                    <td colSpan={7} className="p-3">
                      <div className="h-16 animate-pulse rounded-lg bg-white/10" />
                    </td>
                  </tr>
                ))
              ) : performers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <ImagePlus
                      className="mx-auto h-6 w-6 text-[var(--text-muted)]"
                      aria-hidden
                    />
                    <p className="mt-3 text-[var(--text-body)]">
                      No photos yet. Drag photos into the box above to add your
                      first performer.
                    </p>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-[var(--text-muted)]"
                  >
                    No performers match these filters.
                  </td>
                </tr>
              ) : (
                paged.map((performer) => (
                  <tr
                    key={performer.id}
                    className={cn(
                      "border-b border-white/5 hover:bg-white/[0.03]",
                      justUploaded.has(performer.id) && "bg-emerald-500/[0.07]"
                    )}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${performer.name}`}
                        checked={selected.has(performer.id)}
                        onChange={() => toggleSelected(performer.id)}
                        className="h-4 w-4 rounded border-white/20 bg-white/10"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void move(performer, -1)}
                          disabled={movingId !== null}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] disabled:opacity-40 md:h-8 md:w-8"
                          aria-label={`Move ${performer.name} up`}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-[13px] text-[var(--text-muted)]">
                          {performer.sortOrder}
                        </span>
                        <button
                          type="button"
                          onClick={() => void move(performer, 1)}
                          disabled={movingId !== null}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] disabled:opacity-40 md:h-8 md:w-8"
                          aria-label={`Move ${performer.name} down`}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Thumb performer={performer} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--text-strong)]">
                            {performer.name}
                          </div>
                          <div className="text-[13px] text-[var(--text-muted)]">
                            Updated{" "}
                            {new Date(performer.updatedAt).toLocaleDateString(
                              "en-IN"
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap p-3 text-sm text-[var(--text-body)]">
                      {performer.year}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-white/10 px-2 py-1 text-sm text-[var(--text-muted)]">
                        {performer.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void toggleStatus(performer)}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-sm font-medium transition md:min-h-0",
                          performer.status === "published"
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            : "bg-white/10 text-[var(--text-muted)] hover:bg-white/20"
                        )}
                        aria-label={`Set ${performer.name} to ${
                          performer.status === "published" ? "draft" : "published"
                        }`}
                      >
                        {performer.status}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(performer);
                            setEditorOpen(true);
                          }}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Edit ${performer.name}`}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startReplace(performer)}
                          disabled={replacingId !== null}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] disabled:opacity-40 md:h-8 md:w-8"
                          aria-label={`Replace photo for ${performer.name}`}
                          title="Replace photo"
                        >
                          {replacingId === performer.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => void duplicate(performer)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text-strong)] md:h-8 md:w-8"
                          aria-label={`Duplicate ${performer.name}`}
                          title="Duplicate"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(performer)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded text-red-300/70 hover:bg-red-500/15 hover:text-red-200 md:h-8 md:w-8"
                          aria-label={`Delete ${performer.name}`}
                          title="Delete"
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
          {filtered.length} performer(s) · page {currentPage} of {pageCount}
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

      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleReplaceFile(event)}
      />

      {editorOpen && (
        <PerformerEditor
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditing(null);
          }}
          initial={editing}
          latestYear={latestYear}
          roles={roles}
          onSaved={async () => {
            setEditorOpen(false);
            setEditing(null);
            await refresh();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete performer?"
        description={`“${deleteTarget?.name ?? ""}” will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={() => {
          if (deleteTarget) void deleteOne(deleteTarget);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selected.size} performers?`}
        description="This permanently removes the selected performers and their uploaded photos. This cannot be undone."
        confirmLabel={`Delete ${selected.size}`}
        busy={deleting}
        onConfirm={() => void deleteSelected()}
      />
    </div>
  );
}
