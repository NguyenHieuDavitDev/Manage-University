"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { fetchMyCourseClassEnrollments } from "@/lib/api/courseClassEnrollments";
import { fetchExamPage } from "@/lib/api/exams";
import type { Exam } from "@/lib/types/exam";
import { useEffect, useState } from "react";

function sortExam(a: Exam, b: Exam): number {
  return (
    a.examDate.localeCompare(b.examDate) ||
    a.startPeriod - b.startPeriod ||
    a.courseCode.localeCompare(b.courseCode)
  );
}

export function UserExamScheduleClient() {
  const [rows, setRows] = useState<Exam[]>([]);
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
        const pages = await Promise.all(classIds.map((id) => fetchExamPage(0, 200, "examDate,asc", undefined, id)));
        const merged = pages.flatMap((p) => p.content).sort(sortExam);
        if (!cancelled) setRows(merged);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Không tải được lịch thi");
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
        title="Lịch thi"
        description="Xem lịch thi của các lớp học phần bạn đã đăng ký."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Lịch thi" }]}
      />
      <UserSurface title="Danh sách kỳ thi" titleIcon="fa-solid fa-calendar-check">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
            Đang tải lịch thi...
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-600">Hiện chưa có lịch thi nào cho các học phần đã đăng ký.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Môn học</th>
                  <th className="px-3 py-2 text-left font-semibold">Lớp</th>
                  <th className="px-3 py-2 text-left font-semibold">Loại thi</th>
                  <th className="px-3 py-2 text-left font-semibold">Ngày thi</th>
                  <th className="px-3 py-2 text-left font-semibold">Tiết</th>
                  <th className="px-3 py-2 text-left font-semibold">Phòng</th>
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
                    <td className="px-3 py-2">{row.examTypeName}</td>
                    <td className="px-3 py-2">{row.examDate}</td>
                    <td className="px-3 py-2">
                      {row.startPeriod}-{row.endPeriod}
                    </td>
                    <td className="px-3 py-2">{row.roomCode}</td>
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
