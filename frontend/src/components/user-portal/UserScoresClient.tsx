"use client";

import { FaIcon } from "@/components/FaIcon";
import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { fetchMyCourseClassEnrollments } from "@/lib/api/courseClassEnrollments";
import { fetchStudentGradebook } from "@/lib/api/studentGrades";
import { useEffect, useState } from "react";

type MyScoreRow = {
  courseClassId: number;
  courseCode: string;
  courseName: string;
  sectionCode: string;
  academicYear: string;
  semester: number;
  weightedAverage: number | null;
  letterGrade: string | null;
  componentScores: Array<{
    code: string;
    name: string;
    score: number | null;
    weightPercent: number | null;
  }>;
};

function semesterLabel(s: number): string {
  if (s === 1) return "Học kỳ 1";
  if (s === 2) return "Học kỳ 2";
  if (s === 3) return "Học kỳ 3";
  return `HK ${s}`;
}

function formatScore(score: number | null): string {
  if (score == null) return "-";
  return Number(score).toFixed(2);
}

export function UserScoresClient() {
  const [rows, setRows] = useState<MyScoreRow[]>([]);
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

        const gradebookSettled = await Promise.allSettled(classIds.map((id) => fetchStudentGradebook(id)));
        const gradebooks = gradebookSettled
          .filter((x): x is PromiseFulfilledResult<Awaited<ReturnType<typeof fetchStudentGradebook>>> => x.status === "fulfilled")
          .map((x) => x.value);
        const mapped: MyScoreRow[] = gradebooks
          .map((gb) => {
            // Backend đã giới hạn STUDENT chỉ nhận đúng 1 dòng điểm của chính mình.
            const mine = gb.students[0];
            if (!mine) return null;
            return {
              courseClassId: gb.courseClassId,
              courseCode: gb.courseCode,
              courseName: gb.courseName,
              sectionCode: gb.sectionCode,
              academicYear: gb.academicYear,
              semester: gb.semester,
              weightedAverage: mine.weightedAverage,
              letterGrade: mine.letterGrade,
              componentScores: gb.components.map((c) => ({
                code: c.componentCode,
                name: c.componentName,
                score: mine.scores[String(c.id)] ?? null,
                weightPercent: c.weightPercent,
              })),
            };
          })
          .filter((x): x is MyScoreRow => x != null)
          .sort((a, b) => a.courseCode.localeCompare(b.courseCode));

        if (!cancelled) setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Không tải được điểm số");
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
        title="Điểm số"
        description="Theo dõi điểm thành phần, điểm tổng kết và xếp loại theo từng học phần."
        breadcrumbs={[{ label: "Trang chủ", href: "/user" }, { label: "Điểm số" }]}
      />
      <UserSurface title="Kết quả học tập" titleIcon="fa-solid fa-square-poll-vertical">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
            Đang tải điểm số...
          </p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <p className="text-sm text-slate-600">Hiện chưa có dữ liệu điểm cho các học phần đã đăng ký.</p>
        )}
        {!loading && !error && rows.length > 0 && (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.courseClassId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-900">
                      <span className="font-mono text-indigo-600">{row.courseCode}</span> - {row.courseName}
                    </div>
                    <div className="text-sm text-slate-600">
                      Lớp {row.sectionCode} - {row.academicYear} - {semesterLabel(row.semester)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div>
                      Tổng kết: <span className="font-semibold text-slate-900">{formatScore(row.weightedAverage)}</span>
                    </div>
                    <div>
                      Xếp loại: <span className="font-semibold text-indigo-700">{row.letterGrade ?? "-"}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Thành phần</th>
                        <th className="px-3 py-2 text-left font-semibold">Tỷ trọng</th>
                        <th className="px-3 py-2 text-left font-semibold">Điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {row.componentScores.map((c) => (
                        <tr key={`${row.courseClassId}-${c.code}`}>
                          <td className="px-3 py-2">
                            {c.name} <span className="font-mono text-xs text-slate-500">({c.code})</span>
                          </td>
                          <td className="px-3 py-2">{c.weightPercent != null ? `${c.weightPercent}%` : "-"}</td>
                          <td className="px-3 py-2 font-semibold text-slate-900">{formatScore(c.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </UserSurface>
    </>
  );
}
