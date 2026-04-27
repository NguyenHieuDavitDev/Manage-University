import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type { GradeScale, GradeScalePayload } from "@/lib/types/gradeScale";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/grade-scales`;
}

export async function fetchGradeScales(): Promise<GradeScale[]> {
  const res = await apiFetch(base(), { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được thang điểm (${res.status})`);
  return res.json();
}

export async function createGradeScale(payload: GradeScalePayload): Promise<GradeScale> {
  const res = await apiFetch(base(), { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Tạo thang điểm thất bại"), { apiError: err });
  }
  return res.json();
}

export async function updateGradeScale(id: number, payload: GradeScalePayload): Promise<GradeScale> {
  const res = await apiFetch(`${base()}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Cập nhật thang điểm thất bại"), { apiError: err });
  }
  return res.json();
}

export async function deleteGradeScale(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thang điểm thất bại"), { apiError: err });
  }
}
