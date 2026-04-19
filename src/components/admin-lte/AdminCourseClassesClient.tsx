"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchCourseClassMembers } from "@/lib/api/courseClassEnrollments";
import {
  createCourseClass,
  deleteCourseClass,
  fetchCourseClassPage,
  updateCourseClass,
} from "@/lib/api/courseClasses";
import { fetchCoursePage } from "@/lib/api/courses";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { Course } from "@/lib/types/hrEntities";
import type { CourseClass, CourseClassPayload } from "@/lib/types/courseClass";
import type { CourseClassMember } from "@/lib/types/courseClassEnrollment";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type ClassForm = {
  courseId: number | null;
  sectionCode: string;
  className: string;
  academicYear: string;
  semester: number;
  capacity: string;
  description: string;
};

function emptyForm(): ClassForm {
  return {
    courseId: null,
    sectionCode: "",
    className: "",
    academicYear: "",
    semester: 1,
    capacity: "",
    description: "",
  };
}

function semesterLabel(s: number): string {
  if (s === 1) return "Học kỳ 1";
  if (s === 2) return "Học kỳ 2";
  if (s === 3) return "Học kỳ 3";
  return `HK ${s}`;
}

export default function AdminCourseClassesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const courseIdRaw = searchParams.get("courseId");
  const courseIdFilter =
    courseIdRaw && /^\d+$/.test(courseIdRaw) ? Number(courseIdRaw) : null;

  const [draft, setDraft] = useState(qParam);
  const [data, setData] = useState<SpringPage<CourseClass> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [rosterOpen, setRosterOpen] = useState(false);
  const [rosterTitle, setRosterTitle] = useState("");
  const [rosterClassId, setRosterClassId] = useState<number | null>(null);
  const [rosterRows, setRosterRows] = useState<CourseClassMember[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCoursesLoading(true);
      try {
        const p = await fetchCoursePage(0, 500, "courseName");
        if (!cancelled) setCourseOptions(p.content);
      } catch {
        if (!cancelled) setCourseOptions([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchCourseClassPage(page, 10, "id,desc", qParam || undefined, courseIdFilter);
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, qParam, courseIdFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function pushQuery(nextPage: number, nextQ: string, nextCourseId: number | null | undefined) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    const cid = nextCourseId === undefined ? courseIdFilter : nextCourseId;
    if (cid != null) p.set("courseId", String(cid));
    router.push(`?${p.toString()}`);
  }

  function setPage(p: number) {
    pushQuery(p, qParam, undefined);
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    pushQuery(0, draft, undefined);
  }

  function clearSearch() {
    setDraft("");
    pushQuery(0, "", null);
  }

  function openCreate() {
    setModalMode("create");
    setEditingId(null);
    setForm({
      ...emptyForm(),
      courseId: courseIdFilter,
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(row: CourseClass) {
    setModalMode("edit");
    setEditingId(row.id);
    setForm({
      courseId: row.courseId,
      sectionCode: row.sectionCode,
      className: row.className ?? "",
      academicYear: row.academicYear,
      semester: row.semester,
      capacity: row.capacity != null ? String(row.capacity) : "",
      description: row.description ?? "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (form.courseId == null) {
      setFormError("Chọn học phần.");
      return;
    }
    const capRaw = form.capacity.trim();
    let capacity: number | null | undefined;
    if (capRaw === "") {
      capacity = null;
    } else {
      const n = Number(capRaw);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
        setFieldErrors({ capacity: "Sĩ số tối đa phải là số nguyên dương hoặc để trống." });
        return;
      }
      capacity = n;
    }
    setSaving(true);
    try {
      const payload: CourseClassPayload = {
        courseId: form.courseId,
        sectionCode: form.sectionCode.trim(),
        className: form.className.trim() || null,
        academicYear: form.academicYear.trim(),
        semester: form.semester,
        capacity,
        description: form.description.trim() || null,
      };
      if (modalMode === "create") {
        await createCourseClass(payload);
      } else if (editingId != null) {
        await updateCourseClass(editingId, payload);
      }
      closeModal();
      await load();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  function openRoster(row: CourseClass) {
    setRosterTitle(`${row.courseCode} — ${row.sectionCode}`);
    setRosterClassId(row.id);
    setRosterRows([]);
    setRosterError(null);
    setRosterOpen(true);
    setRosterLoading(true);
    void (async () => {
      try {
        const list = await fetchCourseClassMembers(row.id);
        setRosterRows(list);
      } catch (e) {
        setRosterError(e instanceof Error ? e.message : "Không tải được danh sách");
        setRosterRows([]);
      } finally {
        setRosterLoading(false);
      }
    })();
  }

  function closeRoster() {
    setRosterOpen(false);
    setRosterClassId(null);
  }

  async function handleDelete(row: CourseClass) {
    if (!confirm(`Xóa lớp ${row.sectionCode} (${row.courseCode})?`)) return;
    try {
      await deleteCourseClass(row.id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const hasActiveFilters = Boolean(qParam) || courseIdFilter != null;

  return (
    <>
      <ContentHeader
        title="Lớp học phần"
        titleIcon="fa-solid fa-user-group"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Lớp học phần" },
        ]}
      />

      <LteCard
        title="Danh sách lớp"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button
            type="button"
            onClick={openCreate}
            className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
          >
            <FaIcon icon="fa-solid fa-plus" />
            Thêm lớp
          </button>
        }
      >
        <div className="mb-5 flex gap-3 rounded-xl border border-[#e8f4ec] bg-gradient-to-r from-[#f9fdf9] to-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#28a745]/12 text-[#1e7e34]">
            <FaIcon icon="fa-solid fa-circle-info" className="text-lg" />
          </span>
          <p className="text-sm leading-relaxed text-[#5a6c7d]">
            Mỗi lớp thuộc một <strong className="text-[#495057]">học phần</strong>, có{" "}
            <strong className="text-[#495057]">mã lớp</strong> duy nhất trong phạm vi học phần đó (vd: 01, CLC1),
            kèm năm học và học kỳ mở lớp.
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6c757d]">
              <FaIcon icon="fa-solid fa-book" className="text-[#3c8dbc]" />
              Lọc theo học phần
            </label>
            <select
              className="lte-input w-full max-w-md text-sm"
              disabled={coursesLoading}
              value={courseIdFilter ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                pushQuery(0, qParam, v === "" ? null : Number(v));
              }}
            >
              <option value="">Tất cả học phần</option>
              {courseOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} — {c.courseName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="q"
            className="lte-input min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo mã lớp, tên lớp, năm học, mã/tên học phần…"
          />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearSearch} className="lte-btn lte-btn-ghost lte-btn-sm">
                <FaIcon icon="fa-solid fa-xmark" />
                Xóa lọc
              </button>
            )}
          </div>
        </form>

        {error && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <FaIcon icon="fa-solid fa-circle-exclamation" className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải…</p>
          </div>
        )}
        {!loading && data && (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Học phần</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mã lớp</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tên lớp</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Năm học</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Học kỳ</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Sĩ số (đã ĐK / tối đa)</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mô tả</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center text-[#6c757d]">
                        <FaIcon icon="fa-solid fa-filter-circle-xmark" className="mb-2 text-4xl" />
                        <p className="text-sm font-medium text-[#495057]">Không có dữ liệu</p>
                        <p className="text-xs">
                          {hasActiveFilters
                            ? "Thử bỏ lọc hoặc đổi từ khóa."
                            : "Thêm lớp học phần hoặc tạo học phần trước."}
                        </p>
                      </td>
                    </tr>
                  )}
                  {data.content.map((row) => (
                    <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="max-w-[220px] px-4 py-3">
                        <div className="font-mono text-xs font-medium text-[#3c8dbc]">{row.courseCode}</div>
                        <div className="truncate font-medium text-[#2c3e50]">{row.courseName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#495057]">
                        {row.sectionCode}
                      </td>
                      <td className="max-w-[160px] truncate px-4 py-3 text-[#495057]">
                        {row.className || "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-[#495057]">{row.academicYear}</td>
                      <td className="px-4 py-3 text-[#495057]">{semesterLabel(row.semester)}</td>
                      <td className="px-4 py-3 tabular-nums text-[#495057]">
                        <span className="font-medium">{row.enrolledCount ?? 0}</span>
                        {row.capacity != null ? (
                          <span className="text-[#6c757d]"> / {row.capacity}</span>
                        ) : (
                          <span className="text-[#6c757d]"> / —</span>
                        )}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-[#6c757d]">
                        {row.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openRoster(row)}
                          className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#1e7e34] hover:bg-[#28a745]/10"
                        >
                          <FaIcon icon="fa-solid fa-users" />
                          Danh sách
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#3c8dbc] hover:bg-[#3c8dbc]/10"
                        >
                          <FaIcon icon="fa-solid fa-pen-to-square" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          className="lte-btn lte-btn-danger lte-btn-sm"
                        >
                          <FaIcon icon="fa-solid fa-trash-can" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
                <span>
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} bản ghi
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.first}
                    onClick={() => setPage(page - 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={data.last}
                    onClick={() => setPage(page + 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </LteCard>

      {rosterOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="lte-modal-panel max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="roster-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <div>
                <h4 id="roster-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                  Danh sách ghi danh
                </h4>
                <p className="mt-1 text-xs text-[#6c757d]">{rosterTitle}</p>
              </div>
              <button
                type="button"
                onClick={closeRoster}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <div className="p-5">
              {rosterLoading && (
                <p className="flex items-center gap-2 text-sm text-[#6c757d]">
                  <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
                  Đang tải…
                </p>
              )}
              {rosterError && (
                <p className="text-sm text-red-700">{rosterError}</p>
              )}
              {!rosterLoading && !rosterError && rosterRows.length === 0 && (
                <p className="text-sm text-[#6c757d]">Chưa có sinh viên ghi danh.</p>
              )}
              {!rosterLoading && rosterRows.length > 0 && (
                <div className="lte-table-wrap overflow-x-auto rounded-xl border border-[#e8ecf0]">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8fafb]">
                        <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Họ tên</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Tài khoản</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Thời điểm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rosterRows.map((m) => (
                        <tr key={`${m.userId}-${rosterClassId}`} className="border-b border-[#f0f3f6] last:border-0">
                          <td className="px-3 py-2 font-medium text-[#2c3e50]">{m.fullName}</td>
                          <td className="px-3 py-2 font-mono text-xs text-[#495057]">{m.username}</td>
                          <td className="px-3 py-2 text-xs text-[#6c757d]">
                            {new Date(m.enrolledAt).toLocaleString("vi-VN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="lte-modal-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cc-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 id="cc-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                {modalMode === "create" ? "Thêm lớp học phần" : "Sửa lớp học phần"}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
              {formError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                  {formError}
                </p>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Học phần *</label>
                <select
                  required
                  className="lte-input w-full"
                  disabled={coursesLoading}
                  value={form.courseId ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      courseId: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                >
                  <option value="">— Chọn học phần —</option>
                  {courseOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} — {c.courseName}
                    </option>
                  ))}
                </select>
                {fieldErrors.courseId && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.courseId}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Mã lớp *</label>
                <input
                  required
                  className="lte-input w-full font-mono"
                  value={form.sectionCode}
                  onChange={(e) => setForm((f) => ({ ...f, sectionCode: e.target.value }))}
                  placeholder="vd: 01, CLC1"
                />
                {fieldErrors.sectionCode && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.sectionCode}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Tên lớp</label>
                <input
                  className="lte-input w-full"
                  value={form.className}
                  onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
                  placeholder="Tùy chọn"
                />
                {fieldErrors.className && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.className}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Năm học *</label>
                <input
                  required
                  className="lte-input w-full"
                  value={form.academicYear}
                  onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))}
                  placeholder="vd: 2024-2025"
                />
                {fieldErrors.academicYear && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.academicYear}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Học kỳ *</label>
                <select
                  className="lte-input w-full"
                  value={form.semester}
                  onChange={(e) => setForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                >
                  <option value={1}>{semesterLabel(1)}</option>
                  <option value={2}>{semesterLabel(2)}</option>
                  <option value={3}>{semesterLabel(3)}</option>
                </select>
                {fieldErrors.semester && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.semester}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Sĩ số tối đa</label>
                <input
                  type="number"
                  min={1}
                  className="lte-input w-full"
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  placeholder="Để trống nếu chưa quy định"
                />
                {fieldErrors.capacity && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.capacity}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Mô tả</label>
                <textarea
                  className="lte-input min-h-[88px] w-full resize-y"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={closeModal} className="lte-btn lte-btn-ghost lte-btn-sm">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
                  {saving ? "Đang lưu…" : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
