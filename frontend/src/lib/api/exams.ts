import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type { Exam, ExamAutoSchedulePayload, ExamPage, ExamPayload } from "@/lib/types/exam";

const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };
function base(): string { return `${getApiBaseUrl()}/api/v1/exams`; }

export async function fetchExamPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  courseClassId?: number | null,
  examTypeId?: number | null
): Promise<ExamPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort });
  if (q?.trim()) params.set("q", q.trim());
  if (courseClassId != null) params.set("courseClassId", String(courseClassId));
  if (examTypeId != null) params.set("examTypeId", String(examTypeId));
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được lịch thi (${res.status})`);
  return res.json();
}

export async function createExam(payload: ExamPayload): Promise<Exam> {
  const res = await apiFetch(base(), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Tạo lịch thi thất bại"), { apiError: err });
  }
  return res.json();
}

export async function updateExam(id: number, payload: ExamPayload): Promise<Exam> {
  const res = await apiFetch(`${base()}/${id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Cập nhật lịch thi thất bại"), { apiError: err });
  }
  return res.json();
}

export async function deleteExam(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Xóa lịch thi thất bại");
}

export async function autoScheduleExams(payload: ExamAutoSchedulePayload): Promise<Exam[]> {
  const res = await apiFetch(`${base()}/auto-schedule`, { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Phân lịch thi thất bại"), { apiError: err });
  }
  return res.json();
}
