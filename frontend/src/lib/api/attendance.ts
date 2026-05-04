import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type {
  AttendanceSession,
  AttendanceSessionUpsertPayload,
  AttendanceSlot,
  MyAttendanceDay,
  TeachingCourseClass,
} from "@/lib/types/attendance";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export async function fetchTeachingCourseClasses(): Promise<TeachingCourseClass[]> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/me/teaching-course-classes`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được danh sách lớp giảng dạy"), { apiError: err });
  }
  return res.json();
}

export async function fetchAttendanceSlots(
  courseClassId: number,
  from?: string | null,
  to?: string | null
): Promise<AttendanceSlot[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  const url = `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/attendance/slots${q ? `?${q}` : ""}`;
  const res = await apiFetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được danh sách buổi học"), { apiError: err });
  }
  return res.json();
}

export async function fetchAttendanceSession(
  courseClassId: number,
  classScheduleId: number,
  sessionDate: string
): Promise<AttendanceSession> {
  const res = await apiFetch(
    `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/attendance/sessions/${classScheduleId}/${sessionDate}`,
    { headers: { Accept: "application/json" }, cache: "no-store" }
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được phiên điểm danh"), { apiError: err });
  }
  return res.json();
}

export async function exportAttendanceExcel(
  courseClassId: number,
  classScheduleId: number,
  sessionDate: string
): Promise<void> {
  const res = await apiFetch(
    `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/attendance/sessions/${classScheduleId}/${sessionDate}/export`,
    { method: "GET" }
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(err?.message || "Xuất Excel thất bại");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `attendance-${courseClassId}-${classScheduleId}-${sessionDate}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importAttendanceExcel(
  courseClassId: number,
  classScheduleId: number,
  sessionDate: string,
  file: File
): Promise<AttendanceSession> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(
    `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/attendance/sessions/${classScheduleId}/${sessionDate}/import`,
    { method: "POST", body: fd }
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Import Excel thất bại"), { apiError: err });
  }
  return res.json();
}

export async function saveAttendanceSession(
  courseClassId: number,
  classScheduleId: number,
  sessionDate: string,
  body: AttendanceSessionUpsertPayload
): Promise<AttendanceSession> {
  const res = await apiFetch(
    `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/attendance/sessions/${classScheduleId}/${sessionDate}`,
    { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(body) }
  );
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Lưu điểm danh thất bại"), { apiError: err });
  }
  return res.json();
}

export async function fetchMyAttendanceInClass(
  courseClassId: number,
  from?: string | null,
  to?: string | null
): Promise<MyAttendanceDay[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  const url = `${getApiBaseUrl()}/api/v1/me/course-classes/${courseClassId}/attendance${q ? `?${q}` : ""}`;
  const res = await apiFetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được điểm danh"), { apiError: err });
  }
  return res.json();
}
