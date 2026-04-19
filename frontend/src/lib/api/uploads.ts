import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";

export type AvatarUploadResponse = { url: string };

/** URL đầy đủ tới file trên backend (path tương đối bắt đầu bằng /api/...). */
export function backendPublicFileUrl(path: string): string {
  const p = path.trim();
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const base = getApiBaseUrl();
  return p.startsWith("/") ? `${base}${p}` : `${base}/${p}`;
}

export async function uploadUserAvatar(file: File): Promise<AvatarUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/files/avatars`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || `Upload thất bại (${res.status})`), {
      apiError: err,
    });
  }
  return res.json() as Promise<AvatarUploadResponse>;
}

export async function uploadInsuranceDocument(file: File): Promise<AvatarUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/files/insurances`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || `Upload thất bại (${res.status})`), {
      apiError: err,
    });
  }
  return res.json() as Promise<AvatarUploadResponse>;
}

export async function uploadLaborContractDocument(file: File): Promise<AvatarUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/files/labor-contracts`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || `Upload thất bại (${res.status})`), {
      apiError: err,
    });
  }
  return res.json() as Promise<AvatarUploadResponse>;
}

export async function uploadResearchWorkDocument(file: File): Promise<AvatarUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/files/research-works`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || `Upload thất bại (${res.status})`), {
      apiError: err,
    });
  }
  return res.json() as Promise<AvatarUploadResponse>;
}

export async function uploadCredentialDocument(file: File): Promise<AvatarUploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/files/credentials`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || `Upload thất bại (${res.status})`), {
      apiError: err,
    });
  }
  return res.json() as Promise<AvatarUploadResponse>;
}
