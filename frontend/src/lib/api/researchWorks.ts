import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  ResearchWork,
  ResearchWorkPayload,
  SpringPage,
} from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/research-works`;
}

export async function fetchResearchWorkPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  userId?: string | null,
  workType?: string | null
): Promise<SpringPage<ResearchWork>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const u = userId?.trim();
  if (u) params.set("userId", u);
  const wt = workType?.trim();
  if (wt) params.set("workType", wt);
  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được công trình (${res.status})`);
  return res.json();
}

export async function fetchResearchWorkTypes(): Promise<string[]> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/research-work-types`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Không tải được loại công trình (${res.status})`);
  return res.json();
}

export async function createResearchWork(body: ResearchWorkPayload): Promise<ResearchWork> {
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

export async function updateResearchWork(
  id: number,
  body: ResearchWorkPayload
): Promise<ResearchWork> {
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

export async function deleteResearchWork(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}
