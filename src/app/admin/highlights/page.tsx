"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Pencil, Search, Trash2, Upload, X, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Highlight } from "@/lib/highlights/types";

const MAX_SIZE = 5 * 1024 * 1024;

function validateFile(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Only JPG, PNG or WebP images are allowed.";
  if (file.size > MAX_SIZE) return "Image must be 5 MB or smaller.";
  return null;
}

export default function AdminHighlightsPage() {
  const supabase = createClient();
  const [items, setItems] = React.useState<Highlight[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [yearFilter, setYearFilter] = React.useState("all");
  const [uploading, setUploading] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [artistName, setArtistName] = React.useState("");
  const [editionYear, setEditionYear] = React.useState(new Date().getFullYear());
  const [caption, setCaption] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [editing, setEditing] = React.useState<Highlight | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editYear, setEditYear] = React.useState<number>(new Date().getFullYear());
  const [editCaption, setEditCaption] = React.useState("");
  const [editActive, setEditActive] = React.useState(true);
  const [editFile, setEditFile] = React.useState<File | null>(null);
  const [editPreview, setEditPreview] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Highlight | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setError("");
    try {
      const { data, error: err } = await supabase
        .from("highlights")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message);
      setItems((data ?? []) as Highlight[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load highlights.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  React.useEffect(() => { void load(true); }, [load]);

  const years = React.useMemo(() => Array.from(new Set(items.map((i) => i.edition_year).filter(Boolean) as number[])).sort((a, b) => b - a), [items]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ = !needle || i.artist_name.toLowerCase().includes(needle);
      const matchY = yearFilter === "all" || String(i.edition_year) === yearFilter;
      return matchQ && matchY;
    });
  }, [items, query, yearFilter]);

  const handleSelectFile = (f: File | null) => {
    if (!f) return;
    const invalid = validateFile(f);
    if (invalid) { toast.error(invalid); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const uploadToStorage = async (f: File): Promise<{ url: string; path: string }> => {
    const ext = f.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("highlights").upload(path, f, { contentType: f.type });
    if (upErr) throw new Error(upErr.message);
    const { data } = supabase.storage.from("highlights").getPublicUrl(path);
    return { url: data.publicUrl, path };
  };

  const handleUpload = async () => {
    if (!file || !artistName.trim()) {
      toast.error("Please select an image and enter an artist name.");
      return;
    }
    setUploading(true);
    let uploadedPath: string | null = null;
    try {
      const { url, path } = await uploadToStorage(file);
      uploadedPath = path;
      const { error: insErr } = await supabase.from("highlights").insert({
        artist_name: artistName.trim(),
        edition_year: editionYear,
        caption: caption.trim() || null,
        image_url: url,
        image_path: path,
        is_active: isActive,
        display_order: items.length + 1,
      });
      if (insErr) throw new Error(insErr.message);
      toast.success("Highlight uploaded");
      setFile(null);
      setPreview(null);
      setArtistName("");
      setCaption("");
      setIsActive(true);
      await load(false);
      void fetch("/api/admin/highlights/publish", { method: "POST" });
    } catch (e) {
      if (uploadedPath) {
        try { await supabase.storage.from("highlights").remove([uploadedPath]); } catch { /* ignore */ }
      }
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (item: Highlight) => {
    setEditing(item);
    setEditName(item.artist_name);
    setEditYear(item.edition_year ?? new Date().getFullYear());
    setEditCaption(item.caption ?? "");
    setEditActive(item.is_active);
    setEditFile(null);
    setEditPreview(null);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    let newPath: string | null = null;
    try {
      let image_url = editing.image_url;
      let image_path = editing.image_path;
      if (editFile) {
        const { url, path } = await uploadToStorage(editFile);
        image_url = url;
        image_path = path;
        newPath = path;
        try { await supabase.storage.from("highlights").remove([editing.image_path]); } catch { /* ignore */ }
      }
      const { error: upErr } = await supabase.from("highlights").update({
        artist_name: editName.trim(),
        edition_year: editYear,
        caption: editCaption.trim() || null,
        image_url,
        image_path,
        is_active: editActive,
        updated_at: new Date().toISOString(),
      }).eq("id", editing.id);
      if (upErr) throw new Error(upErr.message);
      toast.success("Highlight updated");
      setEditing(null);
      await load(false);
      void fetch("/api/admin/highlights/publish", { method: "POST" });
    } catch (e) {
      if (newPath) {
        try { await supabase.storage.from("highlights").remove([newPath]); } catch { /* ignore */ }
      }
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: delErr } = await supabase.from("highlights").delete().eq("id", deleteTarget.id);
      if (delErr) throw new Error(delErr.message);
      try { await supabase.storage.from("highlights").remove([deleteTarget.image_path]); } catch { /* ignore */ }
      toast.success("Highlight deleted");
      setDeleteTarget(null);
      await load(false);
      void fetch("/api/admin/highlights/publish", { method: "POST" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const move = async (item: Highlight, direction: -1 | 1) => {
    const index = filtered.findIndex((i) => i.id === item.id);
    const swapWith = filtered[index + direction];
    if (!swapWith) return;
    const next = [...filtered];
    next[index] = swapWith;
    next[index + direction] = item;
    setMovingId(item.id);
    try {
      for (let i = 0; i < next.length; i += 1) {
        const { error: upErr } = await supabase.from("highlights").update({ display_order: i + 1 }).eq("id", next[i].id);
        if (upErr) throw new Error(upErr.message);
      }
      toast.success("Order updated");
      await load(false);
      void fetch("/api/admin/highlights/publish", { method: "POST" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setMovingId(null);
    }
  };

  const toggleActive = async (item: Highlight) => {
    try {
      const { error: upErr } = await supabase.from("highlights").update({ is_active: !item.is_active }).eq("id", item.id);
      if (upErr) throw new Error(upErr.message);
      toast.success(item.is_active ? "Deactivated" : "Activated");
      await load(false);
      void fetch("/api/admin/highlights/publish", { method: "POST" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/highlights/publish", { method: "POST" });
      if (!res.ok) throw new Error("Publish failed");
      toast.success("Highlights published to website");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-strong)] sm:text-3xl">Highlights</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage artist highlights shown on the homepage.</p>
        </div>
        <Button className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:min-h-0 sm:w-auto" disabled={publishing} onClick={() => void handlePublish()}>
          {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Publish to website
        </Button>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6 space-y-4">
        <h2 className="font-display text-xl font-bold text-[var(--text-strong)]">Upload highlight</h2>
        <div
          className="cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center"
          onClick={() => fileInputRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="preview" className="mx-auto max-h-48 rounded-xl object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImagePlus className="h-6 w-6 text-[var(--text-muted)]" />
              <p className="text-sm text-[var(--text-muted)]">Click to select image (JPG/PNG/WebP, max 5MB)</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              handleSelectFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
            placeholder="Artist name *"
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <select
            value={editionYear}
            onChange={(e) => setEditionYear(Number(e.target.value))}
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y} className="bg-[#050816]">{y}</option>
            ))}
          </select>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <Button
          className="min-h-11 w-full rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D] sm:w-auto"
          disabled={uploading}
          onClick={() => void handleUpload()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload highlight
        </Button>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search highlights…"
            className="w-full min-h-11 rounded-full border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm"
          />
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="min-h-11 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="all" className="bg-[#050816]">All years</option>
          {years.map((y) => <option key={y} value={String(y)} className="bg-[#050816]">{y}</option>)}
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/10" />
          ))
        ) : filtered.length === 0 ? (
          <p className="text-[var(--text-muted)]">No highlights yet.</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
              <div className="relative aspect-video overflow-hidden rounded-xl bg-[#0a1f5c]">
                <img src={item.image_url} alt={item.artist_name} className="h-full w-full object-cover" />
                <span className={cn("absolute top-2 right-2 rounded-full px-2 py-0.5 text-xs", item.is_active ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-[var(--text-muted)]")}>
                  {item.is_active ? "active" : "inactive"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--text-strong)]">{item.artist_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{[item.edition_year, item.caption].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => void move(item, -1)} disabled={movingId !== null} aria-label="Move up" className="inline-flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10">
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => void move(item, 1)} disabled={movingId !== null} aria-label="Move down" className="inline-flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10">
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(item)} aria-label="Edit" className="inline-flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => void toggleActive(item)} aria-label="Toggle active" className="inline-flex h-9 w-9 items-center justify-center rounded text-[var(--text-muted)] hover:bg-white/10">
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(item)} aria-label="Delete" className="inline-flex h-9 w-9 items-center justify-center rounded text-red-300/70 hover:bg-red-500/15">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit highlight</DialogTitle>
            <DialogDescription>Update details or replace the image.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editPreview ? (
              <img src={editPreview} alt="preview" className="mx-auto max-h-40 rounded-xl object-contain" />
            ) : editing ? (
              <img src={editing.image_url} alt={editing.artist_name} className="mx-auto max-h-40 rounded-xl object-contain" />
            ) : null}
            <button
              type="button"
              onClick={() => editInputRef.current?.click()}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Replace image
            </button>
            <input
              ref={editInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const invalid = validateFile(f);
                  if (invalid) { toast.error(invalid); return; }
                  setEditFile(f);
                  setEditPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Artist name"
              className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <select
              value={editYear}
              onChange={(e) => setEditYear(Number(e.target.value))}
              className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y} className="bg-[#050816]">{y}</option>
              ))}
            </select>
            <input
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Caption"
              className="w-full min-h-11 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
              Active
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D]" disabled={saving} onClick={() => void handleSaveEdit()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete highlight?</DialogTitle>
            <DialogDescription>“{deleteTarget?.artist_name}” will be permanently removed.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className="rounded-full" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button className="rounded-full bg-[#E5121F] text-white hover:bg-[#FF1F2D]" disabled={deleting} onClick={() => void handleDelete()}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}