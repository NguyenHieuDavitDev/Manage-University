import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  Permission,
  PermissionPayload,
  PermissionSuggestion,
  SpringPage,
} from "@/lib/types/permission";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function permissionsPath(): string {
  return `${getApiBaseUrl()}/api/v1/permissions`;
}

export async function fetchPermissionSuggestions(
  q: string,
  limit = 8
): Promise<PermissionSuggestion[]> {
  const trimmed = q.trim();
  if (!trimmed) {
    return [];
  }
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(limit),
  });
  const res = await apiFetch(`${permissionsPath()}/suggestions?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Gợi ý thất bại (${res.status})`);
  }
  return res.json();
}

export async function fetchPermissionPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null
): Promise<SpringPage<Permission>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  const res = await apiFetch(`${permissionsPath()}?${params}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Không tải được quyền (${res.status})`);
  }
  return res.json();
}

export async function fetchPermissionById(id: number): Promise<Permission> {
  const res = await apiFetch(`${permissionsPath()}/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Không tìm thấy quyền");
  }
  if (!res.ok) {
    throw new Error(`Lỗi tải quyền (${res.status})`);
  }
  return res.json();
}

export async function createPermission(body: PermissionPayload): Promise<Permission> {
  const res = await apiFetch(permissionsPath(), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Tạo thất bại"), {
      apiError: err,
    });
  }
  return res.json();
}

export async function updatePermission(
  id: number,
  body: PermissionPayload
): Promise<Permission> {
  const res = await apiFetch(`${permissionsPath()}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Cập nhật thất bại"), {
      apiError: err,
    });
  }
  return res.json();
}

export async function deletePermission(id: number): Promise<void> {
  const res = await apiFetch(`${permissionsPath()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), {
      apiError: err,
    });
  }
}
