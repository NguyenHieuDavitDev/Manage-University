"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchClassroomPage } from "@/lib/api/classrooms";
import { fetchCourseClassPage } from "@/lib/api/courseClasses";
import { fetchExamTypePage } from "@/lib/api/examTypes";
import { autoScheduleExams, createExam, deleteExam, fetchExamPage, updateExam } from "@/lib/api/exams";
import type { Exam, ExamPayload } from "@/lib/types/exam";
import type { Classroom } from "@/lib/types/classroom";
import type { CourseClass } from "@/lib/types/courseClass";
import type { ExamType, SpringPage } from "@/lib/types/hrEntities";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = {
  courseClassId: number | null;
  examTypeId: number | null;
  classroomId: number | null;
  examDate: string;
  shiftCode: "M1" | "M2" | "A1" | "A2" | "E1";
  description: string;
};
const SHIFTS = {
  M1: { start: 1, end: 3, label: "Sáng ca 1" },
  M2: { start: 4, end: 6, label: "Sáng ca 2" },
  A1: { start: 7, end: 9, label: "Chiều ca 1" },
  A2: { start: 10, end: 12, label: "Chiều ca 2" },
  E1: { start: 13, end: 15, label: "Tối ca 1" },
} as const;
function emptyForm(): FormState {
  return { courseClassId: null, examTypeId: null, classroomId: null, examDate: "", shiftCode: "M1", description: "" };
}

export default function AdminExamsClient() {
  const [data, setData] = useState<SpringPage<Exam> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseClasses, setCourseClasses] = useState<CourseClass[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [examPage, ccPage, etPage, roomPage] = await Promise.all([
        fetchExamPage(0, 200),
        fetchCourseClassPage(0, 500, "id,desc"),
        fetchExamTypePage(0, 200, "id,asc"),
        fetchClassroomPage(0, 500, "roomCode,asc"),
      ]);
      setData(examPage);
      setCourseClasses(ccPage.content);
      setExamTypes(etPage.content as unknown as ExamType[]);
      setClassrooms(roomPage.content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function openCreate() { setEditingId(null); setForm(emptyForm()); setModalOpen(true); }
  function openEdit(row: Exam) {
    const shift = (Object.entries(SHIFTS).find(([,v]) => v.start === row.startPeriod && v.end === row.endPeriod)?.[0] ?? "M1") as FormState["shiftCode"];
    setEditingId(row.id);
    setForm({
      courseClassId: row.courseClassId, examTypeId: row.examTypeId, classroomId: row.classroomId, examDate: row.examDate, shiftCode: shift, description: row.description ?? "",
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.courseClassId == null || form.examTypeId == null || form.classroomId == null || !form.examDate) {
      alert("Vui lòng nhập đủ thông tin.");
      return;
    }
    const shift = SHIFTS[form.shiftCode];
    const payload: ExamPayload = {
      courseClassId: form.courseClassId, examTypeId: form.examTypeId, classroomId: form.classroomId,
      examDate: form.examDate, startPeriod: shift.start, endPeriod: shift.end, description: form.description.trim() || null,
    };
    setSaving(true);
    try {
      if (editingId == null) await createExam(payload); else await updateExam(editingId, payload);
      setModalOpen(false);
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Lưu thất bại"); }
    finally { setSaving(false); }
  }

  async function handleAutoSchedule() {
    if (examTypes.length === 0) return alert("Chưa có loại kỳ thi.");
    const fromDate = prompt("Từ ngày (YYYY-MM-DD):", new Date().toISOString().slice(0,10));
    const toDate = prompt("Đến ngày (YYYY-MM-DD):", "");
    if (!fromDate || !toDate) return;
    try {
      await autoScheduleExams({ examTypeId: examTypes[0].id, fromDate, toDate, classroomIds: classrooms.map(c => c.id) });
      await load();
      alert("Đã phân lịch thi tự động.");
    } catch (e) { alert(e instanceof Error ? e.message : "Phân lịch thất bại"); }
  }

  return (
    <>
      <ContentHeader title="Lịch thi" titleIcon="fa-solid fa-calendar-check" breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Lịch thi" }]} />
      <LteCard title="Danh sách lịch thi" titleIcon="fa-solid fa-list-check" tools={<div className="flex gap-2"><button type="button" onClick={() => void handleAutoSchedule()} className="lte-btn lte-btn-ghost lte-btn-sm"><FaIcon icon="fa-solid fa-wand-magic-sparkles" /> Phân lịch thi</button><button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm"><FaIcon icon="fa-solid fa-plus" /> Thêm lịch thi</button></div>}>
        {error && <p className="mb-3 text-sm text-red-700">{error}</p>}
        {loading && <p className="text-sm text-[#6c757d]">Đang tải...</p>}
        {!loading && data && (
          <div className="lte-table-wrap overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead><tr><th className="border-b px-3 py-2 text-left">Học phần</th><th className="border-b px-3 py-2 text-left">Loại thi</th><th className="border-b px-3 py-2 text-left">Phòng</th><th className="border-b px-3 py-2 text-left">Ngày thi</th><th className="border-b px-3 py-2 text-left">Ca thi</th><th className="border-b px-3 py-2 text-right">Thao tác</th></tr></thead>
              <tbody>
                {data.content.map((r) => (
                  <tr key={r.id} className="border-b border-[#edf1f4] last:border-0">
                    <td className="px-3 py-2">{r.courseCode}-{r.sectionCode}</td>
                    <td className="px-3 py-2">{r.examTypeName}</td>
                    <td className="px-3 py-2">{r.roomCode}</td>
                    <td className="px-3 py-2">{r.examDate}</td>
                    <td className="px-3 py-2">T{r.startPeriod}-T{r.endPeriod}</td>
                    <td className="px-3 py-2 text-right"><button type="button" onClick={() => openEdit(r)} className="lte-btn lte-btn-ghost lte-btn-sm mr-1">Sửa</button><button type="button" onClick={() => void deleteExam(r.id).then(load)} className="lte-btn lte-btn-danger lte-btn-sm">Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </LteCard>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h4 className="mb-4 text-lg font-semibold">{editingId == null ? "Thêm lịch thi" : "Sửa lịch thi"}</h4>
            <form onSubmit={(e) => void handleSave(e)} className="space-y-3">
              <select className="lte-input w-full" value={form.courseClassId ?? ""} onChange={(e)=>setForm(f=>({...f,courseClassId:e.target.value?Number(e.target.value):null}))}><option value="">Chọn lớp học phần</option>{courseClasses.map(c=><option key={c.id} value={c.id}>{c.courseCode}-{c.sectionCode} ({c.courseName})</option>)}</select>
              <select className="lte-input w-full" value={form.examTypeId ?? ""} onChange={(e)=>setForm(f=>({...f,examTypeId:e.target.value?Number(e.target.value):null}))}><option value="">Chọn loại kỳ thi</option>{examTypes.map(t=><option key={t.id} value={t.id}>{t.examTypeCode} - {t.examTypeName}</option>)}</select>
              <select className="lte-input w-full" value={form.classroomId ?? ""} onChange={(e)=>setForm(f=>({...f,classroomId:e.target.value?Number(e.target.value):null}))}><option value="">Chọn phòng thi</option>{classrooms.map(r=><option key={r.id} value={r.id}>{r.roomCode} - {r.roomName}</option>)}</select>
              <input type="date" className="lte-input w-full" value={form.examDate} onChange={(e)=>setForm(f=>({...f,examDate:e.target.value}))} />
              <select className="lte-input w-full" value={form.shiftCode} onChange={(e)=>setForm(f=>({...f,shiftCode:e.target.value as FormState["shiftCode"]}))}>{Object.entries(SHIFTS).map(([k,v])=><option key={k} value={k}>{v.label} (T{v.start}-T{v.end})</option>)}</select>
              <textarea className="lte-input w-full" placeholder="Mô tả" value={form.description} onChange={(e)=>setForm(f=>({...f,description:e.target.value}))} />
              <div className="flex justify-end gap-2"><button type="button" onClick={()=>setModalOpen(false)} className="lte-btn lte-btn-ghost lte-btn-sm">Hủy</button><button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">{saving ? "Đang lưu..." : "Lưu"}</button></div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
