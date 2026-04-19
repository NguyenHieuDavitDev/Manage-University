import { getApiBaseUrl } from "@/lib/config";

/** Ghép base API với đường dẫn tương đối (avatar, file tĩnh). */
export function resolvePublicUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl?.trim()) {
    return null;
  }
  const s = pathOrUrl.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  const base = getApiBaseUrl().replace(/\/$/, "");
  const p = s.startsWith("/") ? s : `/${s}`;
  return `${base}${p}`;
}
