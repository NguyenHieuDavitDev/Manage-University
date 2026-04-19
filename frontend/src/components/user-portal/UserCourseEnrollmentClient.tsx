"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import {
  enrollInCourseClass,
  fetchMyCourseClassEnrollments,
  transferMyCourseClassEnrollment,
  withdrawMyCourseClassEnrollment,
} from "@/lib/api/courseClassEnrollments";
import { fetchCourseClassPage } from "@/lib/api/courseClasses";
import { fetchCoursePage } from "@/lib/api/courses";
import type { ApiErrorBody } from "@/lib/types/common";
import type { CourseClass } from "@/lib/types/courseClass";
import type { Course } from "@/lib/types/hrEntities";
import type { MyCourseClassEnrollment } from "@/lib/types/courseClassEnrollment";
import { useCallback, useEffect, useState } from "react";

const MINE_PAGE_SIZE = 8;
const ENROLLED_SNAPSHOT_SIZE = 500;

function semesterLabel(s: number): string {
  if (s === 1) return "Học kỳ 1";
  if (s === 2) return "Học kỳ 2";
  if (s === 3) return "Học kỳ 3";
  return `HK ${s}`;
}

function formatViDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function UserCourseEnrollmentClient() {
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState<number | null>(null);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [classes, setClasses] = useState<CourseClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [mine, setMine] = useState<MyCourseClassEnrollment[]>([]);
  const [mineLoading, setMineLoading] = useState(true);
  const [mineError, setMineError] = useState<string | null>(null);
  const [minePage, setMinePage] = useState(0);
  const [mineTotalPages, setMineTotalPages] = useState(0);
  const [mineTotalElements, setMineTotalElements] = useState(0);
  const [mineKeyword, setMineKeyword] = useState("");
  const [draftMineQ, setDraftMineQ] = useState("");

  const [enrolledClassIds, setEnrolledClassIds] = useState<Set<number>>(new Set());

  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<number | null>(null);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [transferFor, setTransferFor] = useState<MyCourseClassEnrollment | null>(null);
  const [transferClasses, setTransferClasses] = useState<CourseClass[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferringToId, setTransferringToId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const p = await fetchCoursePage(0, 500, "courseName");
        if (!cancelled) setCourseOptions(p.content);
      } catch {
        if (!cancelled) setCourseOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshEnrolledClassIds = useCallback(async () => {
    try {
      const p = await fetchMyCourseClassEnrollments(0, ENROLLED_SNAPSHOT_SIZE, "enrolledAt,desc", null);
      setEnrolledClassIds(new Set(p.content.map((m) => m.courseClassId)));
    } catch {
      setEnrolledClassIds(new Set());
    }
  }, []);

  const loadMine = useCallback(async () => {
    setMineLoading(true);
    setMineError(null);
    try {
      const p = await fetchMyCourseClassEnrollments(
        minePage,
        MINE_PAGE_SIZE,
        "enrolledAt,desc",
        mineKeyword.trim() || null
      );
      setMine(p.content);
      setMineTotalPages(p.totalPages);
      setMineTotalElements(p.totalElements);
    } catch (e) {
      setMine([]);
      setMineTotalPages(0);
      setMineTotalElements(0);
      setMineError(e instanceof Error ? e.message : "Lỗi tải danh sách đã đăng ký");
    } finally {
      setMineLoading(false);
    }
  }, [minePage, mineKeyword]);

  const loadClasses = useCallback(async () => {
    setClassesLoading(true);
    setClassesError(null);
    try {
      const p = await fetchCourseClassPage(0, 50, "academicYear,desc", q.trim() || undefined, courseFilter);
      setClasses(p.content);
    } catch (e) {
      setClasses([]);
      setClassesError(e instanceof Error ? e.message : "Lỗi tải lớp học phần");
    } finally {
      setClassesLoading(false);
    }
  }, [q, courseFilter]);

  useEffect(() => {
    void refreshEnrolledClassIds();
  }, [refreshEnrolledClassIds]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    if (!transferFor) {
      setTransferClasses([]);
      return;
    }
    const courseId = transferFor.courseId;
    if (courseId == null || Number.isNaN(courseId)) {
      setTransferClasses([]);
      return;
    }
    let cancelled = false;
    setTransferLoading(true);
    void (async () => {
      try {
        const p = await fetchCourseClassPage(0, 200, "sectionCode,asc", undefined, courseId);
        if (!cancelled) setTransferClasses(p.content);
      } catch {
        if (!cancelled) setTransferClasses([]);
      } finally {
        if (!cancelled) setTransferLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transferFor]);

  async function onEnroll(row: CourseClass) {
    setFlash(null);
    setEnrollingId(row.id);
    try {
      await enrollInCourseClass(row.id);
      setFlash({ type: "ok", text: `Đã ghi danh vào lớp ${row.sectionCode} (${row.courseCode}).` });
      await refreshEnrolledClassIds();
      await loadMine();
      await loadClasses();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      setFlash({ type: "err", text: er.message || "Đăng ký thất bại" });
    } finally {
      setEnrollingId(null);
    }
  }

  async function onWithdraw(m: MyCourseClassEnrollment) {
    if (!globalThis.confirm(`Hủy đăng ký lớp ${m.sectionCode} (${m.courseCode})?`)) return;
    setFlash(null);
    setWithdrawingId(m.enrollmentId);
    try {
      await withdrawMyCourseClassEnrollment(m.enrollmentId);
      setFlash({ type: "ok", text: "Đã hủy đăng ký." });
      await refreshEnrolledClassIds();
      await loadMine();
      await loadClasses();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      setFlash({ type: "err", text: er.message || "Hủy đăng ký thất bại" });
    } finally {
      setWithdrawingId(null);
    }
  }

  async function onTransferPick(target: CourseClass) {
    if (!transferFor) return;
    setFlash(null);
    setTransferringToId(target.id);
    try {
      await transferMyCourseClassEnrollment(transferFor.enrollmentId, target.id);
      setFlash({
        type: "ok",
        text: `Đã chuyển sang lớp ${target.sectionCode} (${target.courseCode}).`,
      });
      setTransferFor(null);
      await refreshEnrolledClassIds();
      await loadMine();
      await loadClasses();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      setFlash({ type: "err", text: er.message || "Chuyển lớp thất bại" });
    } finally {
      setTransferringToId(null);
    }
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    setQ(draftQ.trim());
  }

  function applyMineSearch(e: React.FormEvent) {
    e.preventDefault();
    setMinePage(0);
    setMineKeyword(draftMineQ.trim());
  }

  return (
    <>
      <UserPageHeading
        title="Đăng ký học phần"
        description="Ghi danh, xem danh sách đã đăng ký (có tìm kiếm và phân trang), hủy hoặc chuyển sang lớp khác trong cùng học phần."
        breadcrumbs={[
          { label: "Trang chủ", href: "/user" },
          { label: "Đăng ký học phần" },
        ]}
      />

      {flash && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            flash.type === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <FaIcon
            icon={flash.type === "ok" ? "fa-solid fa-circle-check" : "fa-solid fa-circle-exclamation"}
            className="mt-0.5 shrink-0"
          />
          {flash.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <UserSurface title="Lớp tôi đã đăng ký" titleIcon="fa-solid fa-clipboard-list">
          <form onSubmit={applyMineSearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
              value={draftMineQ}
              onChange={(e) => setDraftMineQ(e.target.value)}
              placeholder="Tìm gần đúng: mã học phần, tên lớp, mã lớp, năm học…"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-900"
            >
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Lọc
            </button>
          </form>

          {mineLoading && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
              Đang tải…
            </p>
          )}
          {mineError && <p className="text-sm text-red-700">{mineError}</p>}
          {!mineLoading && !mineError && mine.length === 0 && (
            <p className="text-sm text-slate-600">Không có bản ghi phù hợp. Thử đổi từ khóa hoặc đăng ký ở cột bên phải.</p>
          )}
          {!mineLoading && mine.length > 0 && (
            <>
              <p className="mb-3 text-xs text-slate-500">
                {mineTotalElements} kết quả
                {mineKeyword ? ` · lọc “${mineKeyword}”` : ""}
              </p>
              <ul className="divide-y divide-slate-100">
                {mine.map((m) => (
                  <li key={m.enrollmentId} className="py-3 first:pt-0 last:pb-0">
                    <div className="font-semibold text-slate-900">
                      <span className="font-mono text-indigo-600">{m.courseCode}</span> — {m.courseName}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Lớp <span className="font-mono font-medium">{m.sectionCode}</span>
                      {m.className ? ` · ${m.className}` : ""} · {m.academicYear} · {semesterLabel(m.semester)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">Ghi danh: {formatViDate(m.enrolledAt)}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={withdrawingId === m.enrollmentId}
                        onClick={() => void onWithdraw(m)}
                        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {withdrawingId === m.enrollmentId ? (
                          <>
                            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" /> Đang hủy…
                          </>
                        ) : (
                          "Hủy đăng ký"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransferFor(m)}
                        className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                      >
                        Đổi lớp
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {mineTotalPages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span>
                    Trang {minePage + 1}/{mineTotalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={minePage <= 0 || mineLoading}
                      onClick={() => setMinePage((p) => Math.max(0, p - 1))}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
                    >
                      Trước
                    </button>
                    <button
                      type="button"
                      disabled={minePage >= mineTotalPages - 1 || mineLoading}
                      onClick={() => setMinePage((p) => p + 1)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </UserSurface>

        <UserSurface title="Lớp đang mở" titleIcon="fa-solid fa-door-open">
          <div className="mb-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lọc học phần
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:ring-2"
                value={courseFilter ?? ""}
                onChange={(e) => setCourseFilter(e.target.value === "" ? null : Number(e.target.value))}
              >
                <option value="">Tất cả</option>
                {courseOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} — {c.courseName}
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={applySearch} className="flex flex-col gap-2 sm:flex-row">
              <input
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20"
                value={draftQ}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="Tìm theo mã lớp, năm học, tên học phần…"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
              >
                <FaIcon icon="fa-solid fa-magnifying-glass" />
                Tìm
              </button>
            </form>
          </div>

          {classesError && <p className="mb-3 text-sm text-red-700">{classesError}</p>}
          {classesLoading && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
              Đang tải danh sách lớp…
            </p>
          )}
          {!classesLoading && classes.length === 0 && (
            <p className="text-sm text-slate-600">Không có lớp phù hợp. Thử bỏ lọc hoặc đổi từ khóa.</p>
          )}
          {!classesLoading && classes.length > 0 && (
            <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
              {classes.map((row) => {
                const enrolled = row.enrolledCount ?? 0;
                const cap = row.capacity;
                const full = cap != null && cap > 0 && enrolled >= cap;
                const already = enrolledClassIds.has(row.id);
                return (
                  <div
                    key={row.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-xs font-semibold text-indigo-600">{row.courseCode}</div>
                        <div className="font-semibold text-slate-900">{row.courseName}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          Lớp <span className="font-mono font-medium">{row.sectionCode}</span>
                          {row.className ? ` · ${row.className}` : ""}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {row.academicYear} · {semesterLabel(row.semester)}
                          {cap != null ? (
                            <>
                              {" "}
                              · Đã ghi danh:{" "}
                              <span className="font-medium text-slate-700">
                                {enrolled}/{cap}
                              </span>
                            </>
                          ) : (
                            <> · Đã ghi danh: {enrolled}</>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={already || full || enrollingId === row.id}
                        onClick={() => void onEnroll(row)}
                        className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {enrollingId === row.id ? (
                          <>
                            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" /> Đang gửi…
                          </>
                        ) : already ? (
                          "Đã đăng ký"
                        ) : full ? (
                          "Đủ chỗ"
                        ) : (
                          "Đăng ký"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </UserSurface>
      </div>

      {transferFor && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-title"
        >
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="transfer-title" className="text-lg font-semibold text-slate-900">
                  Chuyển lớp (cùng học phần)
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Hiện tại:{" "}
                  <span className="font-mono font-medium text-indigo-600">{transferFor.sectionCode}</span> —{" "}
                  {transferFor.courseName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTransferFor(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <FaIcon icon="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
              {transferLoading && (
                <p className="flex items-center gap-2 text-sm text-slate-500">
                  <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                  Đang tải các lớp…
                </p>
              )}
              {!transferLoading && transferClasses.length === 0 && (
                <p className="text-sm text-slate-600">Không có lớp nào để chuyển.</p>
              )}
              {!transferLoading && transferClasses.length > 0 && (
                <ul className="space-y-2">
                  {transferClasses
                    .filter((row) => row.id !== transferFor.courseClassId)
                    .map((row) => {
                    const enrolled = row.enrolledCount ?? 0;
                    const cap = row.capacity;
                    const full = cap != null && cap > 0 && enrolled >= cap;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          disabled={full || transferringToId === row.id}
                          onClick={() => void onTransferPick(row)}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm hover:border-indigo-300 hover:bg-indigo-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span>
                            <span className="font-mono font-semibold text-indigo-600">{row.sectionCode}</span>
                            {row.className ? ` · ${row.className}` : ""}
                            <span className="mt-0.5 block text-xs text-slate-500">
                              {row.academicYear} · {semesterLabel(row.semester)}
                              {cap != null ? ` · ${enrolled}/${cap}` : ` · ${enrolled}`}
                            </span>
                          </span>
                          {transferringToId === row.id ? (
                            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-indigo-600" />
                          ) : full ? (
                            <span className="shrink-0 text-xs font-medium text-red-600">Đủ chỗ</span>
                          ) : (
                            <span className="shrink-0 text-xs font-semibold text-indigo-600">Chọn</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
