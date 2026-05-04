"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { fetchMyAttendanceInClass } from "@/lib/api/attendance";
import { fetchMyCourseClassEnrollments } from "@/lib/api/courseClassEnrollments";
import type { MyAttendanceDay } from "@/lib/types/attendance";
import type { MyCourseClassEnrollment } from "@/lib/types/courseClassEnrollment";
import { useEffect, useMemo, useState } from "react";

function statusLabel(code: string): string {
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
      return code;
  }
}

function localDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso: string, delta: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateInputValue(dt);
}

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function UserAttendanceClient() {
  const [enrollments, setEnrollments] = useState<MyCourseClassEnrollment[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [courseClassId, setCourseClassId] = useState<number | null>(null);
  const today = useMemo(() => localDateInputValue(new Date()), []);
  const [from, setFrom] = useState(() => addDays(today, -120));
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<MyAttendanceDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoadingList(true);
      try {
        const p = await fetchMyCourseClassEnrollments(0, 200, "enrolledAt,desc", null);
        if (!cancelled) {
          setEnrollments(p.content);
          if (p.content.length > 0) setCourseClassId((prev) => prev ?? p.content[0].courseClassId);
        }
      } catch {
        if (!cancelled) setEnrollments([]);
      } finally {
        if (!cancelled) setLoadingList(false);
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
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMyAttendanceInClass(courseClassId, from, to);
        if (!cancelled) setRows(data);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Không tải được điểm danh");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseClassId, from, to]);

  const selected = enrollments.find((e) => e.courseClassId === courseClassId);

  function handleExportCsv() {
    if (courseClassId == null || !selected) return;
    const header = ["slotLabel", "sessionDate", "startPeriod", "endPeriod", "roomCode", "status"].join(",");
    const lines = rows.map((r) =>
      [
        csvEscape(r.slotLabel),
        csvEscape(r.sessionDate),
        String(r.startPeriod),
        String(r.endPeriod),
        csvEscape(r.roomCode ?? ""),
        csvEscape(statusLabel(r.status)),
      ].join(",")
    );
    const csv = "\uFEFF" + [header, ...lines].join("\n");
    downloadTextFile(`diem-danh-${selected.courseCode}-${courseClassId}.csv`, csv, "text/csv;charset=utf-8");
  }

  function handlePrint() {
    if (!selected || rows.length === 0) return;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const body = rows
      .map(
        (r) =>
          `<tr><td>${esc(r.slotLabel)}</td><td class="mono">${esc(r.sessionDate)}</td><td>${r.startPeriod}-${
            r.endPeriod
          }</td><td>${esc(r.roomCode ?? "—")}</td><td>${esc(statusLabel(r.status))}</td></tr>`
      )
      .join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Điểm danh</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}h1{font-size:1.15rem}.mono{font-family:ui-monospace,monospace}
table{border-collapse:collapse;width:100%;margin-top:16px;font-size:0.875rem}th,td{border:1px solid #333;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>
<h1>Điểm danh — ${esc(selected.courseName)} (${esc(selected.courseCode)})</h1>
<p style="color:#555;font-size:0.9rem">${esc(selected.academicYear)} · HK${selected.semester} · Từ ${esc(from)} đến ${esc(
      to
    )}</p>
<table><thead><tr><th>Buổi học</th><th>Ngày</th><th>Tiết</th><th>Phòng</th><th>Trạng thái</th></tr></thead><tbody>${body}</tbody></table>
<script>window.onload=function(){window.print();}</script></body></html>`;
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
      <UserPageHeading
        title="Điểm danh"
        description="Xem kết quả điểm danh các buổi học của bạn theo từng lớp học phần."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Điểm danh" }]}
      />
      <UserSurface title="Theo dõi điểm danh" titleIcon="fa-solid fa-clipboard-check">
        {loadingList && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
            Đang tải…
          </p>
        )}
        {!loadingList && enrollments.length === 0 && (
          <p className="text-sm text-slate-600">Bạn chưa đăng ký lớp học phần nào.</p>
        )}
        {!loadingList && enrollments.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Lớp học phần</span>
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={courseClassId ?? ""}
                  onChange={(e) => setCourseClassId(Number(e.target.value))}
                >
                  {enrollments.map((e) => (
                    <option key={e.enrollmentId} value={e.courseClassId}>
                      {e.courseCode} — {e.courseName} ({e.sectionCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Từ ngày</span>
                <input
                  type="date"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={from}
                  onChange={(ev) => setFrom(ev.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-slate-700">Đến ngày</span>
                <input
                  type="date"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={to}
                  onChange={(ev) => setTo(ev.target.value)}
                />
              </label>
            </div>
            {selected && (
              <p className="text-xs text-slate-500">
                {selected.academicYear} · HK{selected.semester}
              </p>
            )}
            {!loading && rows.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExportCsv()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Xuất CSV
                </button>
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  In
                </button>
              </div>
            )}
            {error && <p className="text-sm text-red-700">{error}</p>}
            {loading && (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                Đang tải điểm danh…
              </p>
            )}
            {!loading && !error && rows.length === 0 && (
              <p className="text-sm text-slate-600">Chưa có bản ghi điểm danh trong khoảng thời gian đã chọn.</p>
            )}
            {!loading && rows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Buổi học</th>
                      <th className="px-3 py-2 text-left font-semibold">Tiết</th>
                      <th className="px-3 py-2 text-left font-semibold">Phòng</th>
                      <th className="px-3 py-2 text-left font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={`${r.sessionDate}-${r.classScheduleId}`}>
                        <td className="max-w-[280px] px-3 py-2 text-slate-800">
                          <div className="text-xs leading-snug text-slate-600">{r.slotLabel}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-700">
                          {r.startPeriod}-{r.endPeriod}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.roomCode ? (
                            <span className="font-mono text-xs">{r.roomCode}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{statusLabel(r.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </UserSurface>
    </>
  );
}
