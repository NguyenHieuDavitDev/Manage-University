import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type {
  DutyAssignment,
  DutyAssignmentCreatePayload,
  DutyAssignmentOrgPayload,
} from "@/lib/types/dutyAssignment";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/duty-assignments`;
}

export async function fetchDutyAssignmentPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null
): Promise<SpringPage<DutyAssignment>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được phân công (${res.status})`);
  return res.json();
}

export async function fetchDutyAssignmentByUser(userId: string): Promise<DutyAssignment | null> {
  const res = await apiFetch(`${base()}/by-user/${userId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Không tải phân công theo user (${res.status})`);
  return res.json();
}

export async function createDutyAssignment(
  body: DutyAssignmentCreatePayload
): Promise<DutyAssignment> {
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

export async function updateDutyAssignment(
  id: number,
  body: DutyAssignmentOrgPayload
): Promise<DutyAssignment> {
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

export async function upsertDutyAssignmentByUser(
  userId: string,
  body: DutyAssignmentOrgPayload
): Promise<DutyAssignment> {
  const res = await apiFetch(`${base()}/by-user/${userId}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Lưu thất bại"), { apiError: err });
  }
  return res.json();
}

export async function deleteDutyAssignment(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
