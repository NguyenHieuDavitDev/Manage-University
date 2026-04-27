"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { fetchClassSchedulePage } from "@/lib/api/classSchedules";
import { fetchMyCourseClassEnrollments } from "@/lib/api/courseClassEnrollments";
import type { ClassSchedule } from "@/lib/types/classSchedule";
import { useEffect, useState } from "react";

function dayLabel(day: number): string {
  if (day === 8) return "Chủ nhật";
  return `Thứ ${day}`;
}

export function UserStudyScheduleClient() {
  const [rows, setRows] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const enrolled = await fetchMyCourseClassEnrollments(0, 200, "enrolledAt,desc", null);
        const classIds = [...new Set(enrolled.content.map((x) => x.courseClassId))];
        const pages = await Promise.all(
          classIds.map((id) => fetchClassSchedulePage(0, 200, "dayOfWeek,asc", undefined, id, undefined))
        );
        const merged = pages
          .flatMap((p) => p.content)
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startPeriod - b.startPeriod || a.courseCode.localeCompare(b.courseCode));
        if (!cancelled) setRows(merged);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Không tải được lịch học");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <UserPageHeading
        title="Lịch học"
        description="Xem lịch học theo các lớp học phần bạn đã đăng ký."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Lịch học" }]}
      />
      <UserSurface title="Thời khóa biểu" titleIcon="fa-solid fa-calendar-days">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
            Đang tải lịch học...
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-600">Bạn chưa có lịch học. Hãy đăng ký học phần trước.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Môn học</th>
                  <th className="px-3 py-2 text-left font-semibold">Lớp</th>
                  <th className="px-3 py-2 text-left font-semibold">Thứ</th>
                  <th className="px-3 py-2 text-left font-semibold">Tiết</th>
                  <th className="px-3 py-2 text-left font-semibold">Phòng</th>
                  <th className="px-3 py-2 text-left font-semibold">Giảng viên</th>
                  <th className="px-3 py-2 text-left font-semibold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <div className="font-semibold text-slate-900">{row.courseName}</div>
                      <div className="font-mono text-xs text-indigo-600">{row.courseCode}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700">{row.sectionCode}</td>
                    <td className="px-3 py-2">{dayLabel(row.dayOfWeek)}</td>
                    <td className="px-3 py-2">
                      {row.startPeriod}-{row.endPeriod}
                    </td>
                    <td className="px-3 py-2">{row.roomCode}</td>
                    <td className="px-3 py-2">{row.lecturerFullName || row.lecturerUsername}</td>
                    <td className="px-3 py-2">
                      {row.startDate} - {row.endDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </UserSurface>
    </>
  );
}
