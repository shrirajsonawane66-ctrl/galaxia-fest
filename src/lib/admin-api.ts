/**
 * Thin JSON fetch helper for the admin client pages. Kept in its own module so
 * the list page and its lazily loaded editor can share it without importing a
 * page component.
 */
export async function adminApi<T>(url: string, init?: RequestInit): Promise<T> {
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
