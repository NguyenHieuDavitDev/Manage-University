import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { CourseClassMember, MyCourseClassEnrollment } from "@/lib/types/courseClassEnrollment";

const JSON_ACCEPT = { Accept: "application/json" };
const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function classesBase(): string {
  return `${getApiBaseUrl()}/api/v1/course-classes`;
}

export async function enrollInCourseClass(courseClassId: number): Promise<CourseClassMember> {
  const res = await apiFetch(`${classesBase()}/${courseClassId}/enrollments`, {
    method: "POST",
    headers: JSON_ACCEPT,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Đăng ký thất bại"), { apiError: err });
  }
  return res.json();
}

export async function fetchCourseClassMembers(courseClassId: number): Promise<CourseClassMember[]> {
  const res = await apiFetch(`${classesBase()}/${courseClassId}/enrollments`, {
    headers: JSON_ACCEPT,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được danh sách"), { apiError: err });
  }
  return res.json();
}

export async function fetchMyCourseClassEnrollments(
  page = 0,
  size = 20,
  sort = "enrolledAt,desc",
  q?: string | null
): Promise<SpringPage<MyCourseClassEnrollment>> {
  const params = new URLSearchParams({ page: String(page), size: String(size), sort });
  const t = q?.trim();
  if (t) params.set("q", t);
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/me/course-class-enrollments?${params}`, {
    headers: JSON_ACCEPT,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được lớp đã đăng ký"), { apiError: err });
  }
  return res.json();
}

export async function fetchMyCourseClassEnrollment(enrollmentId: number): Promise<MyCourseClassEnrollment> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/me/course-class-enrollments/${enrollmentId}`, {
    headers: JSON_ACCEPT,
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được đăng ký"), { apiError: err });
  }
  return res.json();
}

export async function transferMyCourseClassEnrollment(
  enrollmentId: number,
  courseClassId: number
): Promise<MyCourseClassEnrollment> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/me/course-class-enrollments/${enrollmentId}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ courseClassId }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Chuyển lớp thất bại"), { apiError: err });
  }
  return res.json();
}

export async function withdrawMyCourseClassEnrollment(enrollmentId: number): Promise<void> {
  const res = await apiFetch(`${getApiBaseUrl()}/api/v1/me/course-class-enrollments/${enrollmentId}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Hủy đăng ký thất bại"), { apiError: err });
  }
}
