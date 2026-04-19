import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  LaborContract,
  LaborContractPayload,
  SpringPage,
} from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/labor-contracts`;
}

export async function fetchLaborContractPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  userId?: string | null,
  contractType?: string | null
): Promise<SpringPage<LaborContract>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const u = userId?.trim();
  if (u) params.set("userId", u);
  const ct = contractType?.trim();
  if (ct) params.set("contractType", ct);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được hợp đồng (${res.status})`);
  return res.json();
}

export async function fetchLaborContractTypes(): Promise<string[]> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/labor-contract-types`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Không tải được loại HĐLĐ (${res.status})`);
  return res.json();
}

export async function createLaborContract(body: LaborContractPayload): Promise<LaborContract> {
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

export async function updateLaborContract(
  id: number,
  body: LaborContractPayload
): Promise<LaborContract> {
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

export async function deleteLaborContract(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
