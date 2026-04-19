import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  AcademicRank,
  AcademicRankPayload,
  ApiErrorBody,
  SpringPage,
} from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/academic-ranks`;
}

export async function fetchAcademicRankPage(
  page: number,
  size = 20,
  sort = "id",
  q?: string | null
): Promise<SpringPage<AcademicRank>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được học hàm (${res.status})`);
  return res.json();
}

export async function createAcademicRank(body: AcademicRankPayload): Promise<AcademicRank> {
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

export async function updateAcademicRank(
  id: number,
  body: AcademicRankPayload
): Promise<AcademicRank> {
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

export async function deleteAcademicRank(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
