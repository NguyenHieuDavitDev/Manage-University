import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type {
  ClassSchedule,
  ClassScheduleMovePayload,
  ClassSchedulePayload,
} from "@/lib/types/classSchedule";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/class-schedules`;
}

export async function fetchClassSchedulePage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  courseClassId?: number | null,
  classroomId?: number | null
): Promise<SpringPage<ClassSchedule>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  if (courseClassId != null && !Number.isNaN(courseClassId)) {
    params.set("courseClassId", String(courseClassId));
  }
  if (classroomId != null && !Number.isNaN(classroomId)) {
    params.set("classroomId", String(classroomId));
  }
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được lịch học (${res.status})`);
  return res.json();
}

export async function createClassSchedule(body: ClassSchedulePayload): Promise<ClassSchedule> {
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

export async function updateClassSchedule(id: number, body: ClassSchedulePayload): Promise<ClassSchedule> {
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

export async function deleteClassSchedule(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}

export async function moveClassSchedule(
  id: number,
  body: ClassScheduleMovePayload
): Promise<ClassSchedule> {
  const res = await apiFetch(`${base()}/${id}/move`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Đổi ca thất bại"), { apiError: err });
  }
  return res.json();
}
