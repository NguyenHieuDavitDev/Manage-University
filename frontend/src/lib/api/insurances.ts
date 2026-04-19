import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, Insurance, InsurancePayload, SpringPage } from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/insurances`;
}

export async function fetchInsurancePage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  userId?: string | null,
  insuranceType?: string | null
): Promise<SpringPage<Insurance>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const u = userId?.trim();
  if (u) params.set("userId", u);
  const it = insuranceType?.trim();
  if (it) params.set("insuranceType", it);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được bảo hiểm (${res.status})`);
  return res.json();
}

export async function fetchInsuranceTypes(): Promise<string[]> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/insurance-types`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Không tải được loại BH (${res.status})`);
  return res.json();
}

export async function createInsurance(body: InsurancePayload): Promise<Insurance> {
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

export async function updateInsurance(id: number, body: InsurancePayload): Promise<Insurance> {
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

export async function deleteInsurance(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
