import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  Role,
  RolePayload,
  RoleSuggestion,
  SpringPage,
} from "@/lib/types/role";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function rolesPath(): string {
  return `${getApiBaseUrl()}/api/v1/roles`;
}

export async function fetchRoleSuggestions(
  q: string,
  limit = 8
): Promise<RoleSuggestion[]> {
  const trimmed = q.trim();
  if (!trimmed) {
    return [];
  }
  const params = new URLSearchParams({
    q: trimmed,
    limit: String(limit),
  });
  const res = await apiFetch(`${rolesPath()}/suggestions?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Gợi ý thất bại (${res.status})`);
  }
  return res.json();
}

export async function fetchRolePage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null
): Promise<SpringPage<Role>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  const res = await apiFetch(`${rolesPath()}?${params}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Không tải được vai trò (${res.status})`);
  }
  return res.json();
}

export async function fetchRoleById(id: number): Promise<Role> {
  const res = await apiFetch(`${rolesPath()}/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Không tìm thấy vai trò");
  }
  if (!res.ok) {
    throw new Error(`Lỗi tải vai trò (${res.status})`);
  }
  return res.json();
}

export async function createRole(body: RolePayload): Promise<Role> {
  const res = await apiFetch(rolesPath(), {
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

export async function updateRole(id: number, body: RolePayload): Promise<Role> {
  const res = await apiFetch(`${rolesPath()}/${id}`, {
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

export async function deleteRole(id: number): Promise<void> {
  const res = await apiFetch(`${rolesPath()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), {
      apiError: err,
    });
  }
}
