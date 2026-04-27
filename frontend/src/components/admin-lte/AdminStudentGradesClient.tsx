"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchCourseClassPage } from "@/lib/api/courseClasses";
import {
  exportGradebookExcel,
  fetchStudentGradebook,
  finalizeGradebook,
  importGradebookExcel,
  upsertStudentScores,
} from "@/lib/api/studentGrades";
import type { CourseClass } from "@/lib/types/courseClass";
import type { StudentGradebook, StudentGradebookComponent, StudentGradebookRow } from "@/lib/types/studentGrade";
import { useEffect, useMemo, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

function semesterLabel(s: number): string {
  if (s === 1) return "HK1";
  if (s === 2) return "HK2";
  if (s === 3) return "HK3";
  return `HK${s}`;
}

export default function AdminStudentGradesClient() {
  const [classOptions, setClassOptions] = useState<CourseClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [courseClassId, setCourseClassId] = useState<number | null>(null);

  const [gradebook, setGradebook] = useState<StudentGradebook | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [togglingFinalize, setTogglingFinalize] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setClassesLoading(true);
      try {
        const p = await fetchCourseClassPage(0, 500, "id,desc");
        if (!cancelled) {
          setClassOptions(p.content);
          if (p.content.length > 0) setCourseClassId((prev) => prev ?? p.content[0].id);
        }
      } catch {
        if (!cancelled) setClassOptions([]);
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
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const gb = await fetchStudentGradebook(courseClassId);
        setGradebook(gb);
      } catch (e) {
        setGradebook(null);
        setError(e instanceof Error ? e.message : "Không tải được bảng điểm");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseClassId]);

  const selectedClass = useMemo(
    () => classOptions.find((c) => c.id === courseClassId) ?? null,
    [classOptions, courseClassId]
  );

  function openEdit(row: StudentGradebookRow, components: StudentGradebookComponent[]) {
    const next: Record<string, string> = {};
    for (const c of components) {
      const val = row.scores[String(c.id)];
      next[String(c.id)] = val == null ? "" : String(val);
    }
    setDraftScores(next);
    setEditingUserId(row.userId);
  }

  function closeEdit() {
    setEditingUserId(null);
    setDraftScores({});
  }

  async function saveRow() {
    if (!gradebook || !editingUserId || courseClassId == null) return;
    if (gradebook.gradebookFinalized) {
      alert("Bảng điểm đã chốt, không thể sửa.");
      return;
    }
    const payload = {
      scores: gradebook.components.map((c) => {
        const raw = (draftScores[String(c.id)] ?? "").trim();
        if (!raw) return { gradeComponentId: c.id, score: null };
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0 || n > 10) {
          throw new Error(`Điểm ${c.componentName} phải từ 0 đến 10`);
        }
        return { gradeComponentId: c.id, score: Number(n.toFixed(2)) };
      }),
    };
    setSaving(true);
    try {
      const gb = await upsertStudentScores(courseClassId, editingUserId, payload);
      setGradebook(gb);
      closeEdit();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFinalize() {
    if (!gradebook || courseClassId == null) return;
    const next = !gradebook.gradebookFinalized;
    const msg = next
      ? "Chốt bảng điểm? Sau khi chốt sẽ khóa sửa điểm."
      : "Mở chốt bảng điểm để cho phép sửa tiếp?";
    if (!confirm(msg)) return;
    setTogglingFinalize(true);
    try {
      const gb = await finalizeGradebook(courseClassId, next);
      setGradebook(gb);
      if (next) closeEdit();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Thao tác thất bại");
    } finally {
      setTogglingFinalize(false);
    }
  }

  async function handleImportExcel(file: File) {
    if (!courseClassId) return;
    if (gradebook?.gradebookFinalized) {
      alert("Bảng điểm đã chốt, không thể import.");
      return;
    }
    setImporting(true);
    try {
      const gb = await importGradebookExcel(courseClassId, file);
      setGradebook(gb);
      closeEdit();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Import thất bại");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <ContentHeader
        title="Chấm điểm sinh viên"
        titleIcon="fa-solid fa-square-poll-vertical"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Chấm điểm sinh viên" }]}
      />
      <LteCard title="Bảng điểm theo lớp học phần" titleIcon="fa-solid fa-table">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-semibold text-[#495057]">Lớp học phần</label>
          <select
            className="lte-input w-full max-w-xl"
            value={courseClassId ?? ""}
            disabled={classesLoading}
            onChange={(e) => setCourseClassId(e.target.value ? Number(e.target.value) : null)}
          >
            {classOptions.length === 0 && <option value="">— Không có lớp học phần —</option>}
            {classOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} - {c.sectionCode} ({c.academicYear}, {semesterLabel(c.semester)})
              </option>
            ))}
          </select>
        </div>

        {selectedClass && (
          <p className="mb-4 text-sm text-[#6c757d]">
            Đang chấm điểm cho <strong>{selectedClass.courseCode}</strong> - {selectedClass.sectionCode}
          </p>
        )}

        {gradebook && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void exportGradebookExcel(gradebook.courseClassId)}
              className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6]"
            >
              <FaIcon icon="fa-solid fa-file-excel" /> Export Excel
            </button>
            <label className="lte-btn lte-btn-ghost lte-btn-sm cursor-pointer border border-[#dee2e6]">
              <FaIcon icon="fa-solid fa-file-arrow-up" /> {importing ? "Đang import..." : "Import Excel"}
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                disabled={importing || gradebook.gradebookFinalized}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImportExcel(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <button
              type="button"
              disabled={togglingFinalize}
              onClick={() => void handleToggleFinalize()}
              className={`lte-btn lte-btn-sm ${gradebook.gradebookFinalized ? "lte-btn-danger" : "lte-btn-primary"}`}
            >
              <FaIcon icon={gradebook.gradebookFinalized ? "fa-solid fa-lock-open" : "fa-solid fa-lock"} />
              {gradebook.gradebookFinalized ? "Mở chốt bảng điểm" : "Chốt bảng điểm"}
            </button>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                gradebook.gradebookFinalized
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {gradebook.gradebookFinalized ? "Đã chốt" : "Đang mở"}
            </span>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        )}
        {loading && (
          <div className="py-12 text-center text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin" /> Đang tải bảng điểm...
          </div>
        )}

        {!loading && gradebook && (
          <div className="lte-table-wrap overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Sinh viên</th>
                  {gradebook.components.map((c) => (
                    <th key={c.id} className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">
                      {c.componentName}
                      <div className="text-xs font-normal text-[#6c757d]">
                        {c.componentCode}
                        {c.weightPercent != null ? ` (${c.weightPercent}%)` : ""}
                      </div>
                    </th>
                  ))}
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Tổng kết</th>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-left font-semibold">Xếp loại</th>
                  <th className="border-b border-[#e3e8ec] px-3 py-2 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {gradebook.students.length === 0 && (
                  <tr>
                    <td colSpan={gradebook.components.length + 4} className="px-3 py-8 text-center text-[#6c757d]">
                      Chưa có sinh viên ghi danh.
                    </td>
                  </tr>
                )}
                {gradebook.students.map((row) => {
                  const isEditing = editingUserId === row.userId;
                  return (
                    <tr key={row.userId} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="px-3 py-2">
                        <div className="font-medium text-[#2c3e50]">{row.fullName}</div>
                        <div className="font-mono text-xs text-[#6c757d]">{row.username}</div>
                      </td>
                      {gradebook.components.map((c) => {
                        const key = String(c.id);
                        const score = row.scores[key];
                        return (
                          <td key={c.id} className="px-3 py-2">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                max={10}
                                step="0.01"
                                className="lte-input w-24"
                                value={draftScores[key] ?? ""}
                                onChange={(e) =>
                                  setDraftScores((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                              />
                            ) : (
                              <span>{score == null ? "—" : score.toFixed(2)}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 font-semibold text-[#2f7494]">
                        {row.weightedAverage == null ? "Chưa đủ điểm" : row.weightedAverage.toFixed(2)}
                      </td>
                      <td className="px-3 py-2">{row.letterGrade ?? "—"}</td>
                      <td className="px-3 py-2 text-right whitespace-nowrap">
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => openEdit(row, gradebook.components)}
                            disabled={gradebook.gradebookFinalized}
                            className="lte-btn lte-btn-ghost lte-btn-sm border-transparent text-[#3c8dbc] disabled:opacity-50"
                          >
                            <FaIcon icon="fa-solid fa-pen-to-square" /> Chấm điểm
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => void saveRow()}
                              disabled={saving}
                              className="lte-btn lte-btn-primary lte-btn-sm mr-1"
                            >
                              <FaIcon icon="fa-solid fa-floppy-disk" /> {saving ? "Đang lưu..." : "Lưu"}
                            </button>
                            <button
                              type="button"
                              onClick={closeEdit}
                              className="lte-btn lte-btn-ghost lte-btn-sm"
                            >
                              Hủy
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LteCard>
    </>
  );
}
