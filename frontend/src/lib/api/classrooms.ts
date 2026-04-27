import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { Classroom, ClassroomPayload } from "@/lib/types/classroom";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/classrooms`;
}

export async function fetchClassroomPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  buildingId?: number | null
): Promise<SpringPage<Classroom>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  if (buildingId != null && !Number.isNaN(buildingId)) params.set("buildingId", String(buildingId));
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được phòng học (${res.status})`);
  return res.json();
}

export async function fetchNextClassroomCode(floorNumber: number): Promise<string> {
  const params = new URLSearchParams({ floorNumber: String(floorNumber) });
  const res = await apiFetch(`${base()}/next-room-code?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không lấy được mã phòng tự động (${res.status})`);
  return res.text();
}

export async function createClassroom(body: ClassroomPayload): Promise<Classroom> {
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

export async function updateClassroom(id: number, body: ClassroomPayload): Promise<Classroom> {
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

export async function deleteClassroom(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
