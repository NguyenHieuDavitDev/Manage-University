import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  SpringPage,
  User,
  UserCreatePayload,
  UserUpdatePayload,
} from "@/lib/types/user";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function usersPath(): string {
  return `${getApiBaseUrl()}/api/v1/users`;
}

export async function fetchUserPage(
  page: number,
  size = 20,
  sort = "createdAt,desc",
  q?: string | null
): Promise<SpringPage<User>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const trimmed = q?.trim();
  if (trimmed) {
    params.set("q", trimmed);
  }
  const res = await apiFetch(`${usersPath()}?${params}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Không tải được người dùng (${res.status})`);
  }
  return res.json();
}

export async function fetchUserById(id: string): Promise<User> {
  const res = await apiFetch(`${usersPath()}/${id}`, { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Không tìm thấy người dùng");
  }
  if (!res.ok) {
    throw new Error(`Lỗi tải người dùng (${res.status})`);
  }
  return res.json();
}

export async function createUser(body: UserCreatePayload): Promise<User> {
  const res = await apiFetch(usersPath(), {
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

export async function updateUser(
  id: string,
  body: UserUpdatePayload
): Promise<User> {
  const res = await apiFetch(`${usersPath()}/${id}`, {
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

export async function deleteUser(id: string): Promise<void> {
  const res = await apiFetch(`${usersPath()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), {
      apiError: err,
    });
  }
}
