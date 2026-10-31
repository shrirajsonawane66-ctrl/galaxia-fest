import type { PerformerRecord } from "@/lib/performers/types";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export type UploadTask = {
  id: string;
  name: string;
  progress: number;
  status: UploadStatus;
  error?: string;
};

export type UploadPayload = {
  url?: string;
  performers?: PerformerRecord[];
  error?: string;
  errors?: { file: string; error: string }[];
};

export const MAX_FILES = 20;
export const MAX_BYTES = 5 * 1024 * 1024;

export function validateFile(file: File): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Only JPG, PNG or WebP images are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5MB or smaller.";
  }
  return null;
}

export function postForm(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void
): Promise<UploadPayload> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "json";

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      const payload = (xhr.response as UploadPayload | null) ?? {};
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload);
        return;
      }
      reject(
        new Error(
          payload.error ||
            payload.errors?.[0]?.error ||
            `Upload failed (${xhr.status})`
        )
      );
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}

export async function uploadImage(
  file: File,
  name: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("name", name);
  const payload = await postForm(
    "/api/admin/performers/upload",
    form,
    onProgress
  );
  if (!payload.url) throw new Error("Upload did not return an image URL.");
  return payload.url;
}

export async function uploadDraft(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PerformerRecord> {
  const form = new FormData();
  form.append("files", file);
  const payload = await postForm(
    "/api/admin/performers/bulk-upload",
    form,
    onProgress
  );
  const created = payload.performers?.[0];
  if (!created) {
    throw new Error(payload.errors?.[0]?.error || "Upload failed.");
  }
  return created;
}
