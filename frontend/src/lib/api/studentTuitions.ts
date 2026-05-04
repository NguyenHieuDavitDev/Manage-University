import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type {
  ApiErrorBody,
  SpringPage,
  StudentTuitionGeneratePlanPayload,
  StudentTuitionPayPayload,
  StudentTuitionPaymentHistory,
  StudentTuitionPayResponse,
  StudentTuition,
  StudentTuitionPayload,
} from "@/lib/types/hrEntities";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(): string {
  return `${getApiBaseUrl()}/api/v1/student-tuitions`;
}

export async function fetchStudentTuitionPage(
  page: number,
  size = 20,
  sort = "id,desc",
  q?: string | null,
  userId?: string | null,
  academicYear?: string | null,
  semester?: number | null,
  paymentStatus?: string | null
): Promise<SpringPage<StudentTuition>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort,
  });
  const t = q?.trim();
  if (t) params.set("q", t);
  const u = userId?.trim();
  if (u) params.set("userId", u);
  const y = academicYear?.trim();
  if (y) params.set("academicYear", y);
  if (semester != null) params.set("semester", String(semester));
  const st = paymentStatus?.trim();
  if (st) params.set("paymentStatus", st);

  const res = await apiFetch(`${base()}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được học phí sinh viên (${res.status})`);
  return res.json();
}

export async function createStudentTuition(body: StudentTuitionPayload): Promise<StudentTuition> {
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

export async function updateStudentTuition(
  id: number,
  body: StudentTuitionPayload
): Promise<StudentTuition> {
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

export async function deleteStudentTuition(id: number): Promise<void> {
  const res = await apiFetch(`${base()}/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Xóa thất bại"), { apiError: err });
  }
}

export async function generateStudentTuitionEightSemesters(
  body: StudentTuitionGeneratePlanPayload
): Promise<StudentTuition[]> {
  const res = await apiFetch(`${base()}/generate-8-semesters`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Sinh kế hoạch học phí thất bại"), { apiError: err });
  }
  return res.json();
}

export async function fetchMyStudentTuitions(): Promise<StudentTuition[]> {
  const res = await apiFetch(`${base()}/mine`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Không tải được học phí của bạn (${res.status})`);
  return res.json();
}

export async function createMyTuitionPayment(
  studentTuitionId: number,
  body: StudentTuitionPayPayload
): Promise<StudentTuitionPayResponse> {
  const res = await apiFetch(`${base()}/mine/${studentTuitionId}/payments`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Tạo thanh toán thất bại"), { apiError: err });
  }
  return res.json();
}

export async function fetchMyInvoiceHtml(paymentId: number): Promise<string> {
  const res = await apiFetch(`${base()}/mine/payments/${paymentId}/invoice-html`, {
    headers: { Accept: "text/html" },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(err?.message || `Không tải được hóa đơn (${res.status})`);
  }
  return res.text();
}

export async function fetchMyPaymentHistory(
  studentTuitionId?: number
): Promise<StudentTuitionPaymentHistory[]> {
  const params = new URLSearchParams();
  if (studentTuitionId != null) params.set("studentTuitionId", String(studentTuitionId));
  const query = params.toString();
  const url = `${base()}/mine/payment-history${query ? `?${query}` : ""}`;
  const res = await apiFetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(err?.message || `Không tải được lịch sử thanh toán (${res.status})`);
  }
  return res.json();
}

export async function fetchAdminPaymentHistory(): Promise<StudentTuitionPaymentHistory[]> {
  const res = await apiFetch(`${base()}/payment-history`, { cache: "no-store" });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(err?.message || `Không tải được thống kê lịch sử thanh toán (${res.status})`);
  }
  return res.json();
}
