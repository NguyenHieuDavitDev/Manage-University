import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type { StudentGradeUpsertPayload, StudentGradebook } from "@/lib/types/studentGrade";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(courseClassId: number): string {
  return `${getApiBaseUrl()}/api/v1/course-classes/${courseClassId}/gradebook`;
}

export async function fetchStudentGradebook(courseClassId: number): Promise<StudentGradebook> {
  const res = await apiFetch(base(courseClassId), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được bảng điểm"), { apiError: err });
  }
  return res.json();
}

export async function upsertStudentScores(
  courseClassId: number,
  userId: string,
  payload: StudentGradeUpsertPayload
): Promise<StudentGradebook> {
  const res = await apiFetch(`${base(courseClassId)}/students/${userId}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Lưu điểm thất bại"), { apiError: err });
  }
  return res.json();
}

export async function finalizeGradebook(courseClassId: number, value: boolean): Promise<StudentGradebook> {
  const res = await apiFetch(`${base(courseClassId)}/finalize?value=${value ? "true" : "false"}`, {
    method: "PUT",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Chốt bảng điểm thất bại"), { apiError: err });
  }
  return res.json();
}

export async function exportGradebookExcel(courseClassId: number): Promise<void> {
  const res = await apiFetch(`${base(courseClassId)}/export`, { method: "GET" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(err?.message || "Xuất Excel thất bại");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gradebook-${courseClassId}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importGradebookExcel(courseClassId: number, file: File): Promise<StudentGradebook> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiFetch(`${base(courseClassId)}/import`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Import Excel thất bại"), { apiError: err });
  }
  return res.json();
}
