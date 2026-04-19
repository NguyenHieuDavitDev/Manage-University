import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, Position, PositionPayload, SpringPage } from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/positions`;
}

export async function fetchPositionPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  positionCategory?: string | null
): Promise<SpringPage<Position>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const c = positionCategory?.trim();
  if (c) params.set("positionCategory", c);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được chức vụ (${res.status})`);
  return res.json();
}

export async function fetchPositionCategories(): Promise<string[]> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/position-categories`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được nhóm chức vụ (${res.status})`);
  return res.json();
}

export async function createPosition(body: PositionPayload): Promise<Position> {
  const res = await apiFetch(base(), {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Tạo thất bại"), { apiError: err });
  }
  return res.json();
}

export async function updatePosition(id: number, body: PositionPayload): Promise<Position> {
  const res = await apiFetch(`${base()}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Cập nhật thất bại"), { apiError: err });
  }
  return res.json();
}

export async function deletePosition(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
