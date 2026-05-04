"use client";

import { ContentHeader } from "@/components/admin-lte/ContentHeader";
import { LteCard } from "@/components/admin-lte/Card";
import { FaIcon } from "@/components/FaIcon";
import {
  exportAttendanceExcel,
  fetchAttendanceSession,
  fetchAttendanceSlots,
  importAttendanceExcel,
  fetchTeachingCourseClasses,
  saveAttendanceSession,
} from "@/lib/api/attendance";
import { fetchCourseClassPage } from "@/lib/api/courseClasses";
import { fetchMe } from "@/lib/api/auth";
import { normalizedRoleCodes } from "@/lib/portalRouting";
import type {
  AttendanceSession,
  AttendanceSlot,
  AttendanceStatusCode,
  TeachingCourseClass,
} from "@/lib/types/attendance";
import type { CourseClass } from "@/lib/types/courseClass";
import { useEffect, useMemo, useRef, useState } from "react";

const STATUS_OPTIONS: { value: AttendanceStatusCode; label: string }[] = [
  { value: "PRESENT", label: "Có mặt" },
  { value: "ABSENT", label: "Vắng" },
  { value: "LATE", label: "Muộn" },
  { value: "EXCUSED", label: "Có phép" },
];

type ClassOption = { id: number; label: string };

function addDaysIso(iso: string, delta: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function slotRange(): { from: string; to: string } {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const today = `${y}-${m}-${d}`;
  return { from: addDaysIso(today, -120), to: addDaysIso(today, 180) };
}

function slotOptionValue(s: AttendanceSlot): string {
  return `${s.classScheduleId}::${s.sessionDate}`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusLabelVi(code: string): string {
  switch (code) {
    case "PRESENT":
      return "Có mặt";
    case "ABSENT":
      return "Vắng";
    case "LATE":
      return "Muộn";
    case "EXCUSED":
      return "Có phép";
    default:
      return code || "—";
  }
}

function parseSlotValue(v: string): { classScheduleId: number; sessionDate: string } | null {
  const i = v.indexOf("::");
  if (i <= 0) return null;
  const sid = Number(v.slice(0, i));
  const date = v.slice(i + 2);
  if (!Number.isFinite(sid) || !date) return null;
  return { classScheduleId: sid, sessionDate: date };
}

export default function AdminAttendanceClient() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [courseClassId, setCourseClassId] = useState<number | null>(null);

  const [slots, setSlots] = useState<AttendanceSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedSlotValue, setSelectedSlotValue] = useState("");

  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [draft, setDraft] = useState<Record<number, AttendanceStatusCode | "">>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setClassesLoading(true);
      try {
        const me = await fetchMe();
        const admin = normalizedRoleCodes(me.roles).has("ADMIN");
        if (!cancelled) setIsAdmin(admin);
        let opts: ClassOption[] = [];
        if (admin) {
          const p = await fetchCourseClassPage(0, 500, "id,desc");
          opts = p.content.map((c: CourseClass) => ({
            id: c.id,
            label: `${c.courseCode} — ${c.courseName} (${c.sectionCode})`,
          }));
        } else {
          const teaching: TeachingCourseClass[] = await fetchTeachingCourseClasses();
          opts = teaching.map((c) => ({
            id: c.id,
            label: `${c.courseCode} — ${c.courseName} (${c.sectionCode})`,
          }));
        }
        if (!cancelled) {
          setClassOptions(opts);
          if (opts.length > 0) setCourseClassId((prev) => prev ?? opts[0].id);
        }
      } catch {
        if (!cancelled) {
          setClassOptions([]);
          setError("Không tải được danh sách lớp.");
        }
      } finally {
        if (!cancelled) setClassesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (courseClassId == null) return;
    let cancelled = false;
    void (async () => {
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlotValue("");
      setSession(null);
      setDraft({});
      try {
        const { from, to } = slotRange();
        const list = await fetchAttendanceSlots(courseClassId, from, to);
        if (cancelled) return;
        setSlots(list);
        if (list.length > 0) {
          setSelectedSlotValue(slotOptionValue(list[0]));
        }
      } catch (e) {
        if (!cancelled) {
          setSlots([]);
          setSlotsError(e instanceof Error ? e.message : "Không tải được buổi học");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseClassId]);

  const parsedSlot = useMemo(() => parseSlotValue(selectedSlotValue), [selectedSlotValue]);

  useEffect(() => {
    if (courseClassId == null || parsedSlot == null) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await fetchAttendanceSession(courseClassId, parsedSlot.classScheduleId, parsedSlot.sessionDate);
        if (cancelled) return;
        setSession(s);
        const next: Record<number, AttendanceStatusCode | ""> = {};
        for (const row of s.students) {
          next[row.enrollmentId] = row.status ?? "";
        }
        setDraft(next);
      } catch (e) {
        if (cancelled) return;
        setSession(null);
        setDraft({});
        setError(e instanceof Error ? e.message : "Không tải được điểm danh");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseClassId, parsedSlot]);

  const selectedLabel = useMemo(
    () => classOptions.find((c) => c.id === courseClassId)?.label ?? "",
    [classOptions, courseClassId]
  );

  async function handleSave() {
    if (courseClassId == null || !session || parsedSlot == null) return;
    const missing = session.students.filter((r) => !draft[r.enrollmentId]);
    if (missing.length > 0) {
      alert("Vui lòng chọn trạng thái điểm danh cho tất cả sinh viên.");
      return;
    }
    const items = session.students.map((r) => ({
      enrollmentId: r.enrollmentId,
      status: draft[r.enrollmentId] as AttendanceStatusCode,
    }));
    setSaving(true);
    try {
      const updated = await saveAttendanceSession(
        courseClassId,
        parsedSlot.classScheduleId,
        parsedSlot.sessionDate,
        { items }
      );
      setSession(updated);
      const next: Record<number, AttendanceStatusCode | ""> = {};
      for (const row of updated.students) {
        next[row.enrollmentId] = row.status ?? "";
      }
      setDraft(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportExcel() {
    if (courseClassId == null || parsedSlot == null) return;
    try {
      await exportAttendanceExcel(courseClassId, parsedSlot.classScheduleId, parsedSlot.sessionDate);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xuất Excel thất bại");
    }
  }

  async function handleImportFile(file: File) {
    if (courseClassId == null || parsedSlot == null) return;
    setImporting(true);
    try {
      const updated = await importAttendanceExcel(
        courseClassId,
        parsedSlot.classScheduleId,
        parsedSlot.sessionDate,
        file
      );
      setSession(updated);
      const next: Record<number, AttendanceStatusCode | ""> = {};
      for (const row of updated.students) {
        next[row.enrollmentId] = row.status ?? "";
      }
      setDraft(next);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import thất bại");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  function handlePrint() {
    if (!session || courseClassId == null) return;
    const rowsHtml = session.students
      .map(
        (r) =>
          `<tr><td>${escHtml(r.fullName || "")}</td><td>${escHtml(r.username)}</td><td>${escHtml(
            statusLabelVi(draft[r.enrollmentId] || r.status || "")
          )}</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Điểm danh</title>
<style>
body{font-family:system-ui,sans-serif;padding:24px;color:#222}
h1{font-size:1.25rem;margin:0 0 8px}
.meta{font-size:0.9rem;color:#444;margin-bottom:20px}
table{border-collapse:collapse;width:100%;font-size:0.875rem}
th,td{border:1px solid #333;padding:8px;text-align:left}
th{background:#f0f0f0}
</style></head><body>
<h1>Phiếu điểm danh</h1>
<div class="meta">${escHtml(selectedLabel)}<br/>${escHtml(session.slotLabel)}${
      session.roomCode
        ? `<br/>Phòng: ${escHtml(session.roomCode)}${session.roomName ? ` (${escHtml(session.roomName)})` : ""}`
        : ""
    }${session.lecturerFullName ? `<br/>Giảng viên: ${escHtml(session.lecturerFullName)}` : ""}</div>
<table><thead><tr><th>Sinh viên</th><th>Tài khoản</th><th>Trạng thái</th></tr></thead><tbody>${rowsHtml}</tbody></table>
<script>window.onload=function(){window.print();}</script>
</body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      alert("Trình duyệt chặn cửa sổ mới — không thể in.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  return (
    <>
      <ContentHeader
        title="Điểm danh lớp"
        titleIcon="fa-solid fa-clipboard-user"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Điểm danh lớp" },
        ]}
      />
      <section className="content px-3 pb-6 pt-2 sm:px-4">
        <LteCard title="Chọn lớp và buổi học" titleIcon="fa-solid fa-calendar-week">
          {classesLoading && (
            <p className="flex items-center gap-2 text-sm text-[#777]">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
              Đang tải danh sách lớp…
            </p>
          )}
          {!classesLoading && classOptions.length === 0 && (
            <p className="text-sm text-[#777]">
              {isAdmin
                ? "Chưa có lớp học phần trong hệ thống."
                : "Bạn chưa được phân công giảng dạy trên thời khóa biểu."}
            </p>
          )}
          {!classesLoading && classOptions.length > 0 && (
            <div className="flex flex-col gap-4">
              <label className="flex min-w-[240px] flex-1 flex-col gap-1 text-sm">
                <span className="font-medium text-[#444]">Lớp học phần</span>
                <select
                  className="rounded border border-[#d2d6de] bg-white px-2 py-2 text-sm"
                  value={courseClassId ?? ""}
                  onChange={(e) => setCourseClassId(Number(e.target.value))}
                >
                  {classOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-[#444]">Buổi học (theo thời khóa biểu)</span>
                {slotsLoading && (
                  <p className="flex items-center gap-2 text-sm text-[#777]">
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                    Đang tải danh sách buổi…
                  </p>
                )}
                {!slotsLoading && slotsError && <p className="text-sm text-red-700">{slotsError}</p>}
                {!slotsLoading && !slotsError && slots.length === 0 && (
                  <p className="text-sm text-[#777]">Chưa có buổi học trong khoảng thời gian tra cứu (hoặc chưa có TKB).</p>
                )}
                {!slotsLoading && slots.length > 0 && (
                  <select
                    className="rounded border border-[#d2d6de] bg-white px-2 py-2 text-sm"
                    value={selectedSlotValue}
                    onChange={(e) => setSelectedSlotValue(e.target.value)}
                  >
                    {slots.map((s) => (
                      <option key={slotOptionValue(s)} value={slotOptionValue(s)}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}
              </label>
            </div>
          )}
          <p className="mt-3 text-xs text-[#888]">
            Buổi học được sinh tự động từ thời khóa biểu (thứ, tiết, phòng, khoảng ngày hiệu lực). Giảng viên chỉ thấy
            các buổi mình được phân công; quản trị viên thấy toàn bộ buổi của lớp.
          </p>
        </LteCard>

        <div className="mt-4">
          <LteCard title="Danh sách sinh viên" titleIcon="fa-solid fa-users">
            {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
            {loading && (
              <p className="flex items-center gap-2 text-sm text-[#777]">
                <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                Đang tải…
              </p>
            )}
            {!loading && session && (
              <>
                <p className="mb-2 text-sm text-[#555]">
                  <span className="font-semibold">{selectedLabel}</span>
                </p>
                <div className="mb-4 rounded-lg border border-[#e8ecf0] bg-[#fafcfd] px-3 py-2.5 text-sm text-[#444]">
                  <div className="font-medium text-[#2c3e50]">{session.slotLabel}</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#666]">
                    {session.roomCode && (
                      <span>
                        Phòng: <span className="font-mono">{session.roomCode}</span>
                        {session.roomName ? ` (${session.roomName})` : ""}
                      </span>
                    )}
                    {session.lecturerFullName && <span>GV: {session.lecturerFullName}</span>}
                    <span className="font-mono">TKB #{session.classScheduleId}</span>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleImportFile(f);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void handleExportExcel()}
                    disabled={importing}
                    className="rounded border border-[#d2d6de] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f9f9f9] disabled:opacity-50"
                  >
                    <FaIcon icon="fa-solid fa-file-export" className="mr-1.5" />
                    Xuất Excel
                  </button>
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importing}
                    className="rounded border border-[#d2d6de] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f9f9f9] disabled:opacity-50"
                  >
                    <FaIcon icon="fa-solid fa-file-import" className="mr-1.5" />
                    {importing ? "Đang import…" : "Import Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint()}
                    className="rounded border border-[#d2d6de] bg-white px-3 py-1.5 text-sm text-[#444] hover:bg-[#f9f9f9]"
                  >
                    <FaIcon icon="fa-solid fa-print" className="mr-1.5" />
                    In
                  </button>
                </div>
                <p className="mb-4 text-xs text-[#888]">
                  Import dùng cùng cấu trúc file đã xuất. Chỉ các dòng có cột <strong>status</strong> khác trống mới được
                  ghi (PRESENT, ABSENT, LATE, EXCUSED). Có thể điền <strong>enrollmentId</strong> hoặc <strong>userId</strong>{" "}
                  để nhận diện sinh viên.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#f4f4f4] text-sm">
                    <thead className="bg-[#f9f9f9] text-[#444]">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Sinh viên</th>
                        <th className="px-3 py-2 text-left font-semibold">Tài khoản</th>
                        <th className="px-3 py-2 text-left font-semibold">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f4f4f4]">
                      {session.students.map((r) => (
                        <tr key={r.enrollmentId}>
                          <td className="px-3 py-2">{r.fullName || "—"}</td>
                          <td className="px-3 py-2 font-mono text-xs text-[#666]">{r.username}</td>
                          <td className="px-3 py-2">
                            <select
                              className="w-full max-w-[200px] rounded border border-[#d2d6de] bg-white px-2 py-1.5 text-sm"
                              value={draft[r.enrollmentId] ?? ""}
                              onChange={(e) =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [r.enrollmentId]: e.target.value as AttendanceStatusCode | "",
                                }))
                              }
                            >
                              <option value="">— Chọn —</option>
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={saving || session.students.length === 0}
                    onClick={() => void handleSave()}
                    className="rounded bg-[#3c8dbc] px-4 py-2 text-sm font-medium text-white hover:bg-[#367fa9] disabled:opacity-50"
                  >
                    {saving ? "Đang lưu…" : "Lưu điểm danh"}
                  </button>
                </div>
              </>
            )}
          </LteCard>
        </div>
      </section>
    </>
  );
}
