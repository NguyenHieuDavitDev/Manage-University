"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createClassSchedule,
  deleteClassSchedule,
  fetchClassSchedulePage,
  moveClassSchedule,
  updateClassSchedule,
} from "@/lib/api/classSchedules";
import { fetchClassroomPage } from "@/lib/api/classrooms";
import { fetchCourseClassPage } from "@/lib/api/courseClasses";
import { fetchCoursePage } from "@/lib/api/courses";
import { fetchUserPage } from "@/lib/api/users";
import type { ClassSchedule, ClassSchedulePayload } from "@/lib/types/classSchedule";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { CourseClass } from "@/lib/types/courseClass";
import type { Classroom } from "@/lib/types/classroom";
import type { Course } from "@/lib/types/hrEntities";
import type { User } from "@/lib/types/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = {
  courseClassId: number | null;
  classroomId: number | null;
  lecturerUserId: string;
  dayOfWeek: number;
  shiftCode: "M1" | "M2" | "A1" | "A2" | "E1";
  startDate: string;
  endDate: string;
  description: string;
};

function emptyForm(): FormState {
  return {
    courseClassId: null,
    classroomId: null,
    lecturerUserId: "",
    dayOfWeek: 2,
    shiftCode: "M1",
    startDate: "",
    endDate: "",
    description: "",
  };
}

function dayLabel(day: number): string {
  if (day === 8) return "Chủ nhật";
  return `Thứ ${day}`;
}

function periodToTime(period: number): string {
  const map: Record<number, string> = {
    1: "07:00",
    2: "07:50",
    3: "08:40",
    4: "09:30",
    5: "10:20",
    6: "11:10",
    7: "13:00",
    8: "13:50",
    9: "14:40",
    10: "15:30",
    11: "16:20",
    12: "17:10",
    13: "18:30",
    14: "19:10",
    15: "19:50",
  };
  return map[period] ?? "--:--";
}

function periodEndTime(period: number): string {
  const map: Record<number, string> = {
    1: "07:50",
    2: "08:40",
    3: "09:30",
    4: "10:20",
    5: "11:10",
    6: "12:00",
    7: "13:50",
    8: "14:40",
    9: "15:30",
    10: "16:20",
    11: "17:10",
    12: "18:00",
    13: "19:10",
    14: "19:50",
    15: "20:30",
  };
  return map[period] ?? "--:--";
}

function periodRangeLabel(startPeriod: number, endPeriod: number): string {
  return `Tiết ${startPeriod}-${endPeriod} (${periodToTime(startPeriod)} - ${periodEndTime(endPeriod)})`;
}

function shiftDisplay(startPeriod: number, endPeriod: number): string {
  const hit = SHIFT_OPTIONS.find((s) => s.startPeriod === startPeriod && s.endPeriod === endPeriod);
  if (!hit) return `CA??? (T${startPeriod}-T${endPeriod})`;
  const codeToCa: Record<string, string> = {
    M1: "CA001",
    M2: "CA002",
    A1: "CA001",
    A2: "CA002",
    E1: "CA001",
  };
  return `${codeToCa[hit.code]} • ${hit.label}`;
}

const SHIFT_OPTIONS: Array<{
  code: FormState["shiftCode"];
  label: string;
  startPeriod: number;
  endPeriod: number;
}> = [
  { code: "M1", label: "Sáng - Ca 1 (07:00-10:00)", startPeriod: 1, endPeriod: 3 },
  { code: "M2", label: "Sáng - Ca 2 (09:30-12:00)", startPeriod: 4, endPeriod: 6 },
  { code: "A1", label: "Chiều - Ca 1 (13:00-15:30)", startPeriod: 7, endPeriod: 9 },
  { code: "A2", label: "Chiều - Ca 2 (15:30-18:00)", startPeriod: 10, endPeriod: 12 },
  { code: "E1", label: "Tối - Ca 1 (18:30-20:30)", startPeriod: 13, endPeriod: 15 },
];

function periodsByShift(code: FormState["shiftCode"]): { startPeriod: number; endPeriod: number } {
  const hit = SHIFT_OPTIONS.find((x) => x.code === code);
  if (!hit) return { startPeriod: 1, endPeriod: 3 };
  return { startPeriod: hit.startPeriod, endPeriod: hit.endPeriod };
}

function shiftByPeriods(startPeriod: number, endPeriod: number): FormState["shiftCode"] {
  const hit = SHIFT_OPTIONS.find((x) => x.startPeriod === startPeriod && x.endPeriod === endPeriod);
  return hit?.code ?? "M1";
}

function weekStartMonday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const jsDay = x.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  x.setDate(x.getDate() + diff);
  return x;
}

function toLocalDateIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const CALENDAR_SHIFT_ROWS = [
  { code: "M1", title: "Sáng • Ca 1", start: 1, end: 3 },
  { code: "M2", title: "Sáng • Ca 2", start: 4, end: 6 },
  { code: "A1", title: "Chiều • Ca 1", start: 7, end: 9 },
  { code: "A2", title: "Chiều • Ca 2", start: 10, end: 12 },
  { code: "E1", title: "Tối • Ca 1", start: 13, end: 15 },
] as const;

function dayShortLabel(dayOfWeek: number): string {
  if (dayOfWeek === 8) return "CN";
  return `T${dayOfWeek}`;
}

function weeksByCredits(credits: number | null | undefined): number {
  if (credits === 2) return 10;
  if (credits === 3) return 15;
  if (credits === 5) return 5;
  return 15;
}

function computeEndDateFromStart(startDateIso: string, weeks: number): string {
  if (!startDateIso) return "";
  const d = new Date(`${startDateIso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + (weeks - 1) * 7);
  return toLocalDateIso(d);
}

export default function AdminClassSchedulesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const courseClassIdRaw = searchParams.get("courseClassId");
  const classroomIdRaw = searchParams.get("classroomId");
  const courseClassIdFilter =
    courseClassIdRaw && /^\d+$/.test(courseClassIdRaw) ? Number(courseClassIdRaw) : null;
  const classroomIdFilter =
    classroomIdRaw && /^\d+$/.test(classroomIdRaw) ? Number(classroomIdRaw) : null;

  const [draft, setDraft] = useState(qParam);
  const [data, setData] = useState<SpringPage<ClassSchedule> | null>(null);
  const [calendarRows, setCalendarRows] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courseClassOptions, setCourseClassOptions] = useState<CourseClass[]>([]);
  const [classroomOptions, setClassroomOptions] = useState<Classroom[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<User[]>([]);
  const [courseOptions, setCourseOptions] = useState<Course[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [weekAnchor, setWeekAnchor] = useState<Date>(() => weekStartMonday(new Date()));
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [calendarMode, setCalendarMode] = useState<"WEEK" | "DAY">("WEEK");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [draggingScheduleId, setDraggingScheduleId] = useState<number | null>(null);
  const [hoverDropCell, setHoverDropCell] = useState<string | null>(null);
  const [quickCell, setQuickCell] = useState<{
    dayOfWeek: number;
    shiftCode: FormState["shiftCode"];
    dateIso: string;
  } | null>(null);
  const [dragModeEnabled, setDragModeEnabled] = useState(false);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [classes, rooms, users, courses] = await Promise.all([
          fetchCourseClassPage(0, 200, "id,desc"),
          fetchClassroomPage(0, 500, "roomCode,asc"),
          fetchUserPage(0, 500, "fullName,asc"),
          fetchCoursePage(0, 500, "courseCode,asc"),
        ]);
        const teachers = users.content.filter((u) =>
          (u.roles ?? []).some((r) =>
            ["TEACHER", "GIANG_VIEN", "LECTURER"].includes((r.roleCode || "").toUpperCase())
          )
        );
        if (!cancelled) {
          setCourseClassOptions(classes.content);
          setClassroomOptions(rooms.content);
          setTeacherOptions(teachers);
          setCourseOptions(courses.content);
        }
      } catch {
        if (!cancelled) {
          setCourseClassOptions([]);
          setClassroomOptions([]);
          setTeacherOptions([]);
          setCourseOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchClassSchedulePage(
        page,
        10,
        "id,desc",
        qParam || undefined,
        courseClassIdFilter,
        classroomIdFilter
      );
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, qParam, courseClassIdFilter, classroomIdFilter]);

  const loadCalendarRows = useCallback(async () => {
    try {
      const p = await fetchClassSchedulePage(
        0,
        2000,
        "id,desc",
        qParam || undefined,
        courseClassIdFilter,
        classroomIdFilter
      );
      setCalendarRows(p.content ?? []);
    } catch {
      setCalendarRows([]);
    }
  }, [qParam, courseClassIdFilter, classroomIdFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCalendarRows();
  }, [loadCalendarRows]);

  useEffect(() => {
    if (!form.startDate || form.courseClassId == null) return;
    const selectedClass = courseClassOptions.find((x) => x.id === form.courseClassId);
    const selectedCourse = selectedClass
      ? courseOptions.find((c) => c.id === selectedClass.courseId)
      : undefined;
    const weeks = weeksByCredits(selectedCourse?.credits);
    const endDate = computeEndDateFromStart(form.startDate, weeks);
    if (!endDate) return;
    setForm((f) => (f.endDate === endDate ? f : { ...f, endDate }));
  }, [form.startDate, form.courseClassId, courseClassOptions, courseOptions]);

  function pushQuery(
    nextPage: number,
    nextQ: string,
    nextCourseClassId?: number | null,
    nextClassroomId?: number | null
  ) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    const classId = nextCourseClassId === undefined ? courseClassIdFilter : nextCourseClassId;
    const roomId = nextClassroomId === undefined ? classroomIdFilter : nextClassroomId;
    if (classId != null) p.set("courseClassId", String(classId));
    if (roomId != null) p.set("classroomId", String(roomId));
    router.push(`?${p.toString()}`);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openCreateAtCell(
    dayOfWeek: number,
    shiftCode: FormState["shiftCode"],
    dateIso: string,
    kind: "normal" | "supplement"
  ) {
    setEditingId(null);
    setForm({
      ...emptyForm(),
      dayOfWeek,
      shiftCode,
      startDate: kind === "supplement" ? dateIso : "",
      endDate: kind === "supplement" ? dateIso : "",
      description: kind === "supplement" ? "Tăng cường tiết" : "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
    setQuickCell(null);
  }

  function openEdit(row: ClassSchedule) {
    setEditingId(row.id);
    setForm({
      courseClassId: row.courseClassId,
      classroomId: row.classroomId,
      lecturerUserId: row.lecturerUserId,
      dayOfWeek: row.dayOfWeek,
      shiftCode: shiftByPeriods(row.startPeriod, row.endPeriod),
      startDate: row.startDate,
      endDate: row.endDate,
      description: row.description ?? "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    if (form.courseClassId == null || form.classroomId == null) {
      setFormError("Vui lòng chọn lớp học phần và phòng học.");
      return;
    }
    if (!form.lecturerUserId) {
      setFieldErrors({ lecturerUserId: "Chọn tài khoản giảng viên." });
      return;
    }

    const { startPeriod, endPeriod } = periodsByShift(form.shiftCode);
    if (!form.startDate) {
      setFieldErrors({ startDate: "Nhập ngày bắt đầu." });
      return;
    }
    if (!form.endDate) {
      setFieldErrors({ endDate: "Không tính được ngày kết thúc theo số tín chỉ." });
      return;
    }
    if (form.endDate < form.startDate) {
      setFieldErrors({ endDate: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu." });
      return;
    }

    setSaving(true);
    try {
      const payload: ClassSchedulePayload = {
        courseClassId: form.courseClassId,
        classroomId: form.classroomId,
        dayOfWeek: form.dayOfWeek,
        startPeriod,
        endPeriod,
        startDate: form.startDate,
        endDate: form.endDate,
        lecturerUserId: form.lecturerUserId,
        description: form.description.trim() || null,
      };
      if (editingId == null) await createClassSchedule(payload);
      else await updateClassSchedule(editingId, payload);
      setModalOpen(false);
      await Promise.all([load(), loadCalendarRows()]);
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: ClassSchedule) {
    if (!confirm(`Xoa lich hoc ${row.courseCode}-${row.sectionCode}?`)) return;
    try {
      await deleteClassSchedule(row.id);
      await Promise.all([load(), loadCalendarRows()]);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function handleDropSchedule(
    targetDayOfWeek: number,
    targetShiftCode: FormState["shiftCode"],
    targetDate: string
  ) {
    if (draggingScheduleId == null) return;
    try {
      await moveClassSchedule(draggingScheduleId, {
        dayOfWeek: targetDayOfWeek,
        shiftCode: targetShiftCode,
        targetDate,
      });
      await Promise.all([load(), loadCalendarRows()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Đổi lịch thất bại");
    } finally {
      setDraggingScheduleId(null);
    }
  }

  function setPage(nextPage: number) {
    pushQuery(nextPage, qParam);
  }

  function clearSearch() {
    setDraft("");
    pushQuery(0, "", null, null);
  }

  const hasActiveFilters = Boolean(qParam) || courseClassIdFilter != null || classroomIdFilter != null;
  const weekDates = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAnchor);
      d.setDate(weekAnchor.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [weekAnchor]);

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
  }, [weekDates]);

  const calendarSchedules = useMemo(() => {
    const rows = calendarRows;
    return rows.filter((s) => {
      const weekDayDate = weekDates[s.dayOfWeek === 8 ? 6 : s.dayOfWeek - 2];
      if (!weekDayDate) return false;
      const x = toLocalDateIso(weekDayDate);
      return x >= s.startDate && x <= s.endDate;
    });
  }, [calendarRows, weekDates]);

  useEffect(() => {
    const jsDay = new Date().getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    setSelectedDayIdx(idx);
  }, []);

  return (
    <>
      <ContentHeader
        title="Quan ly lich hoc"
        titleIcon="fa-solid fa-calendar-days"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Lịch học" }]}
      />
      <LteCard
        title="Danh sách lịch học"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm shadow-sm">
            <FaIcon icon="fa-solid fa-plus" />
            Thêm lịch
          </button>
        }
      >
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#e3e8ec] bg-gradient-to-br from-white to-[#f8fbff] p-4 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6c757d]">
              Lọc theo lớp học phần
            </label>
            <select
              className="lte-input w-full"
              value={courseClassIdFilter ?? ""}
              onChange={(e) =>
                pushQuery(
                  0,
                  qParam,
                  e.target.value === "" ? null : Number(e.target.value),
                  undefined
                )
              }
            >
              <option value="">Tất cả lớp học phần</option>
              {courseClassOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} - {c.sectionCode} ({c.courseName})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6c757d]">
              Lọc theo phòng học
            </label>
            <select
              className="lte-input w-full"
              value={classroomIdFilter ?? ""}
              onChange={(e) =>
                pushQuery(
                  0,
                  qParam,
                  undefined,
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
            >
              <option value="">Tất cả phòng học</option>
              {classroomOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.roomCode} - {c.roomName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushQuery(0, draft);
          }}
          className="mb-4 flex flex-col gap-2 rounded-xl border border-[#e8edf2] bg-white/70 p-3 sm:flex-row"
        >
          <input
            className="lte-input flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo học phần, phòng, giảng viên, mô tả..."
          />
          <div className="flex gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm
            </button>
            {hasActiveFilters && (
              <button type="button" className="lte-btn lte-btn-ghost lte-btn-sm" onClick={clearSearch}>
                <FaIcon icon="fa-solid fa-filter-circle-xmark" />
                Xóa lọc
              </button>
            )}
          </div>
        </form>
        {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="mb-5 rounded-2xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-[#2c3e50]">
              <FaIcon icon="fa-solid fa-calendar-week" />
              Lịch học tập ({weekLabel})
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() => setCalendarOpen((v) => !v)}
              >
                <FaIcon icon={calendarOpen ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
                {calendarOpen ? "Ẩn lịch" : "Hiện lịch"}
              </button>
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() =>
                  setWeekAnchor((d) => {
                    const x = new Date(d);
                    x.setDate(x.getDate() - 7);
                    return x;
                  })
                }
              >
                <FaIcon icon="fa-solid fa-chevron-left" />
                Tuần trước
              </button>
              <button type="button" className="lte-btn lte-btn-ghost lte-btn-sm" onClick={() => setWeekAnchor(weekStartMonday(new Date()))}>
                <FaIcon icon="fa-solid fa-calendar-day" />
                Tuần này
              </button>
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm"
                onClick={() =>
                  setWeekAnchor((d) => {
                    const x = new Date(d);
                    x.setDate(x.getDate() + 7);
                    return x;
                  })
                }
              >
                <FaIcon icon="fa-solid fa-chevron-right" />
                Tuần sau
              </button>
            </div>
          </div>

          {calendarOpen && (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`lte-btn lte-btn-sm ${calendarMode === "WEEK" ? "lte-btn-primary" : "lte-btn-ghost"}`}
                  onClick={() => setCalendarMode("WEEK")}
                >
                  <FaIcon icon="fa-solid fa-table-columns" />
                  Giao diện toàn tuần
                </button>
                <button
                  type="button"
                  className={`lte-btn lte-btn-sm ${calendarMode === "DAY" ? "lte-btn-primary" : "lte-btn-ghost"}`}
                  onClick={() => setCalendarMode("DAY")}
                >
                  <FaIcon icon="fa-solid fa-list-ul" />
                  Giao diện mỗi ngày
                </button>
                <button
                  type="button"
                  className={`lte-btn lte-btn-sm ${dragModeEnabled ? "lte-btn-primary" : "lte-btn-ghost"}`}
                  onClick={() => setDragModeEnabled((v) => !v)}
                >
                  <FaIcon icon={dragModeEnabled ? "fa-solid fa-arrows-up-down-left-right" : "fa-solid fa-arrows-up-down"} />
                  {dragModeEnabled ? "Tắt chế độ đổi lịch" : "Bật chế độ đổi lịch"}
                </button>
              </div>
              <p className="mb-3 rounded-lg border border-[#e9edf2] bg-[#f8fafc] px-3 py-2 text-xs text-[#5f6b76]">
                Bấm vào ô trống để thêm lịch nhanh hoặc tăng cường tiết. Khi cần đổi lịch học, bật chế độ đổi lịch và
                kéo-thả lịch sang ô mới.
              </p>

              {calendarMode === "WEEK" && (
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-[#dfe6ec] bg-[#fcfdff]">
                    <table className="min-w-full table-fixed text-xs">
                      <colgroup>
                        <col className="w-28" />
                        <col span={7} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="bg-[#f7f0b5] px-2 py-2 text-left font-semibold text-[#495057]" />
                          {weekDates.map((_, idx) => {
                            const day = idx === 6 ? 8 : idx + 2;
                            return (
                              <th
                                key={idx}
                                className="border-l border-white/25 bg-[#10a644] px-2 py-2 text-center font-semibold text-white first:border-l-0"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedDayIdx(idx);
                                    setCalendarMode("DAY");
                                  }}
                                  className="w-full"
                                >
                                  <FaIcon icon="fa-solid fa-calendar-day" className="mr-1" />
                                  {dayShortLabel(day)}
                                </button>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {CALENDAR_SHIFT_ROWS.map((shift) => (
                          <tr key={shift.code}>
                            <td className="w-28 border-r border-b bg-[#f4f7fa] px-2 py-2 font-semibold text-[#2f3c48]">
                              <div>{shift.title}</div>
                              <div className="text-[10px] text-[#6c757d]">
                                T{shift.start}-T{shift.end}
                              </div>
                            </td>
                            {weekDates.map((dateObj, idx) => {
                              const day = idx === 6 ? 8 : idx + 2;
                              const dateIso = toLocalDateIso(dateObj);
                              const items = calendarSchedules.filter(
                                (s) =>
                                  s.dayOfWeek === day &&
                                  s.startPeriod === shift.start &&
                                  s.endPeriod === shift.end
                              );
                              const cellKey = `${shift.code}-${day}`;
                              return (
                                <td
                                  key={idx}
                                  className="h-24 border-b border-l px-1.5 py-1 align-top first:border-l-0"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (dragModeEnabled && draggingScheduleId != null) setHoverDropCell(cellKey);
                                  }}
                                  onDragLeave={() => {
                                    if (hoverDropCell === cellKey) setHoverDropCell(null);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    if (!dragModeEnabled) return;
                                    setHoverDropCell(null);
                                    void handleDropSchedule(day, shift.code, dateIso);
                                  }}
                                >
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                      if (items.length === 0) {
                                        setQuickCell({ dayOfWeek: day, shiftCode: shift.code, dateIso });
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if ((e.key === "Enter" || e.key === " ") && items.length === 0) {
                                        setQuickCell({ dayOfWeek: day, shiftCode: shift.code, dateIso });
                                      }
                                    }}
                                    className={`min-h-[76px] max-h-[92px] overflow-y-auto rounded-lg border border-dashed p-1.5 transition ${
                                      hoverDropCell === cellKey
                                        ? "border-[#10a644] bg-[#e9f8ee]"
                                        : "border-[#edf1f4] bg-white"
                                    }`}
                                  >
                                    {items.length === 0 && draggingScheduleId != null && (
                                      <p className="text-center text-[10px] text-[#7a8a97]">Thả lịch vào đây</p>
                                    )}
                                    {items.length === 0 && draggingScheduleId == null && (
                                      <p className="text-center text-[10px] text-[#9aa6b2]">
                                        Bấm ô trống để thao tác
                                      </p>
                                    )}
                                    {items.map((s) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        draggable={dragModeEnabled}
                                        onDragStart={() => setDraggingScheduleId(s.id)}
                                        onDragEnd={() => {
                                          setDraggingScheduleId(null);
                                          setHoverDropCell(null);
                                        }}
                                        onClick={() => openEdit(s)}
                                        className="mb-1 block w-full max-w-full overflow-hidden rounded-lg border border-[#cbe9d9] bg-[#f5fff9] px-1.5 py-1.5 text-left shadow-[0_1px_2px_rgba(16,166,68,0.08)] last:mb-0"
                                      >
                                        <div className="truncate text-[10px] font-semibold text-[#0e6b4f]">
                                          <FaIcon icon="fa-solid fa-door-open" className="mr-1" />
                                          {s.roomCode}
                                        </div>
                                        <div className="truncate text-[10px] text-[#6c757d]">
                                          <FaIcon icon="fa-solid fa-book-open" className="mr-1" />
                                          {s.courseCode}-{s.sectionCode}
                                        </div>
                                        <div className="truncate text-[10px] text-[#6c757d]">
                                          <FaIcon icon="fa-solid fa-clock" className="mr-1" />
                                          {shiftDisplay(s.startPeriod, s.endPeriod)}
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {calendarMode === "DAY" && (
                <div className="rounded-xl border border-[#dfe6ec] bg-[#fcfdff] p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {weekDates.map((d, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDayIdx(idx)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                          selectedDayIdx === idx ? "bg-[#10a644] text-white" : "bg-[#f1f3f5] text-[#495057]"
                        }`}
                      >
                        {d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {CALENDAR_SHIFT_ROWS.map((shift) => {
                      const day = selectedDayIdx === 6 ? 8 : selectedDayIdx + 2;
                      const selectedDateIso = toLocalDateIso(weekDates[selectedDayIdx]);
                      const items = calendarSchedules.filter(
                        (s) =>
                          s.dayOfWeek === day &&
                          s.startPeriod === shift.start &&
                          s.endPeriod === shift.end
                      );
                      return (
                        <div key={shift.code} className="flex gap-2 rounded-lg border border-[#e5ebf0] bg-white p-2.5">
                          <div className="w-28 rounded-md bg-[#f4f7fa] px-2 py-1 text-xs font-semibold text-[#2c3e50]">
                            <div>{shift.title}</div>
                            <div className="text-[11px] text-[#6c757d]">T{shift.start}-T{shift.end}</div>
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (items.length === 0) {
                                setQuickCell({ dayOfWeek: day, shiftCode: shift.code, dateIso: selectedDateIso });
                              }
                            }}
                            onKeyDown={(e) => {
                              if ((e.key === "Enter" || e.key === " ") && items.length === 0) {
                                setQuickCell({ dayOfWeek: day, shiftCode: shift.code, dateIso: selectedDateIso });
                              }
                            }}
                            className="flex-1 space-y-1"
                          >
                            {items.length === 0 ? (
                              <p className="rounded-md border border-dashed border-[#d6dde4] px-2 py-2 text-xs text-[#adb5bd]">
                                Trống - bấm để thao tác
                              </p>
                            ) : (
                              items.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  draggable={dragModeEnabled}
                                  onDragStart={() => setDraggingScheduleId(s.id)}
                                  onDragEnd={() => setDraggingScheduleId(null)}
                                  onClick={() => openEdit(s)}
                                  className="w-full rounded-lg border border-[#d9ecf8] bg-[#f4faff] px-2 py-1.5 text-left shadow-[0_1px_2px_rgba(47,116,148,0.08)]"
                                >
                                  <div className="text-xs font-semibold text-[#2f7494]">
                                    <FaIcon icon="fa-solid fa-book-open" className="mr-1" />
                                    {s.courseCode}-{s.sectionCode} • {s.roomCode}
                                  </div>
                                  <div className="text-[11px] text-[#6c757d]">
                                    <FaIcon icon="fa-solid fa-user-tie" className="mr-1" />
                                    {s.lecturerFullName} • {shiftDisplay(s.startPeriod, s.endPeriod)}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải...</p>
          </div>
        )}
        {!loading && data && (
          <div className="lte-table-wrap overflow-x-auto rounded-xl border border-[#e2e8ee]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#f7fafc] text-[#4b5a67]">
                  <th className="border-b px-3 py-2.5 text-left">Học phần</th>
                  <th className="border-b px-3 py-2.5 text-left">Giảng viên</th>
                  <th className="border-b px-3 py-2.5 text-left">Phòng</th>
                  <th className="border-b px-3 py-2.5 text-left">Thứ</th>
                  <th className="border-b px-3 py-2.5 text-left">Thời gian dạy</th>
                  <th className="border-b px-3 py-2.5 text-left">Dạy từ ngày</th>
                  <th className="border-b px-3 py-2.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#6c757d]">
                      Không có dữ liệu lịch học.
                    </td>
                  </tr>
                )}
                {data.content.map((row) => (
                  <tr key={row.id} className="border-b border-[#edf1f4] transition hover:bg-[#fafcff] last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs text-[#3c8dbc]">{row.courseCode}</div>
                      <div className="font-medium text-[#2c3e50]">
                        {row.courseName} - {row.sectionCode}
                      </div>
                      {row.className && <div className="text-xs text-[#6c757d]">{row.className}</div>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.lecturerFullName}</div>
                      <div className="font-mono text-xs text-[#6c757d]">{row.lecturerUsername}</div>
                    </td>
                    <td className="px-3 py-2">{row.roomCode} - {row.roomName}</td>
                    <td className="px-3 py-2">{dayLabel(row.dayOfWeek)}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{shiftDisplay(row.startPeriod, row.endPeriod)}</div>
                      <div className="text-xs text-[#6c757d]">{periodRangeLabel(row.startPeriod, row.endPeriod)}</div>
                    </td>
                    <td className="px-3 py-2">
                      {row.startDate} - {row.endDate}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="lte-btn lte-btn-ghost lte-btn-sm mr-1"
                      >
                        <FaIcon icon="fa-solid fa-pen-to-square" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(row)}
                        className="lte-btn lte-btn-danger lte-btn-sm"
                      >
                        <FaIcon icon="fa-solid fa-trash" />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-[#6c757d]">
            <span>
              Trang {data.number + 1}/{data.totalPages} - {data.totalElements} bản ghi
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={data.first}
                onClick={() => setPage(page - 1)}
                className="lte-btn lte-btn-ghost lte-btn-sm disabled:opacity-40"
              >
                <FaIcon icon="fa-solid fa-angle-left" />
                Trước
              </button>
              <button
                type="button"
                disabled={data.last}
                onClick={() => setPage(page + 1)}
                className="lte-btn lte-btn-ghost lte-btn-sm disabled:opacity-40"
              >
                <FaIcon icon="fa-solid fa-angle-right" />
                Sau
              </button>
            </div>
          </div>
        )}
      </LteCard>

      {quickCell && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h4 className="mb-1 flex items-center gap-2 text-lg font-semibold text-[#2c3e50]">
              <FaIcon icon="fa-solid fa-wand-magic-sparkles" />
              Thao tác nhanh ô lịch
            </h4>
            <p className="mb-4 text-sm text-[#6c757d]">
              {dayLabel(quickCell.dayOfWeek)} -{" "}
              {SHIFT_OPTIONS.find((x) => x.code === quickCell.shiftCode)?.label ?? quickCell.shiftCode} -{" "}
              {quickCell.dateIso}
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className="lte-btn lte-btn-primary lte-btn-sm w-full justify-center"
                onClick={() => openCreateAtCell(quickCell.dayOfWeek, quickCell.shiftCode, quickCell.dateIso, "normal")}
              >
                <FaIcon icon="fa-solid fa-calendar-plus" />
                Thêm lịch học mới
              </button>
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm w-full justify-center"
                onClick={() =>
                  openCreateAtCell(quickCell.dayOfWeek, quickCell.shiftCode, quickCell.dateIso, "supplement")
                }
              >
                <FaIcon icon="fa-solid fa-bolt" />
                Tăng cường tiết (thêm lịch bổ sung)
              </button>
              <button
                type="button"
                className="lte-btn lte-btn-ghost lte-btn-sm w-full justify-center"
                onClick={() => {
                  setDragModeEnabled(true);
                  setQuickCell(null);
                }}
              >
                <FaIcon icon="fa-solid fa-right-left" />
                Đổi lịch học (bật kéo-thả)
              </button>
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" className="lte-btn lte-btn-ghost lte-btn-sm" onClick={() => setQuickCell(null)}>
                <FaIcon icon="fa-solid fa-xmark" />
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <FaIcon icon={editingId == null ? "fa-solid fa-calendar-plus" : "fa-solid fa-pen-to-square"} />
              {editingId == null ? "Thêm lịch học" : "Sửa lịch học"}
            </h4>
            {formError && <p className="mb-3 text-sm text-red-700">{formError}</p>}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <select
                className="lte-input w-full"
                value={form.courseClassId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, courseClassId: e.target.value ? Number(e.target.value) : null }))
                }
              >
                <option value="">Chọn lớp học phần</option>
                {courseClassOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.courseCode} - {c.sectionCode} ({c.courseName})
                  </option>
                ))}
              </select>
              <select
                className="lte-input w-full"
                value={form.classroomId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, classroomId: e.target.value ? Number(e.target.value) : null }))
                }
              >
                <option value="">Chọn phòng học</option>
                {classroomOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.roomCode} - {c.roomName}
                  </option>
                ))}
              </select>
              <select
                className="lte-input w-full"
                value={form.lecturerUserId}
                onChange={(e) => setForm((f) => ({ ...f, lecturerUserId: e.target.value }))}
              >
                <option value="">Chọn tài khoản giảng viên (role Teacher)</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.username})
                  </option>
                ))}
              </select>
              {fieldErrors.lecturerUserId && (
                <p className="text-xs text-red-700">{fieldErrors.lecturerUserId}</p>
              )}
              <select
                className="lte-input w-full"
                value={form.dayOfWeek}
                onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
              >
                {[2, 3, 4, 5, 6, 7, 8].map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
              <select
                className="lte-input w-full"
                value={form.shiftCode}
                onChange={(e) => setForm((f) => ({ ...f, shiftCode: e.target.value as FormState["shiftCode"] }))}
              >
                {SHIFT_OPTIONS.map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="lte-input"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="lte-input"
                  value={form.endDate}
                  readOnly
                  disabled
                />
              </div>
              <p className="text-xs text-[#6c757d]">
                Ngày kết thúc được tự động tính theo số tín chỉ học phần: 2TC=10 tuần, 3TC=15 tuần, 5TC=5 tuần.
              </p>
              {(fieldErrors.startDate || fieldErrors.endDate) && (
                <p className="text-xs text-red-700">{fieldErrors.startDate || fieldErrors.endDate}</p>
              )}
              <textarea
                className="lte-input w-full"
                placeholder="Mô tả"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="lte-btn lte-btn-ghost lte-btn-sm"
                >
                  <FaIcon icon="fa-solid fa-ban" />
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
                  <FaIcon icon={saving ? "fa-solid fa-spinner" : "fa-solid fa-floppy-disk"} className={saving ? "animate-spin" : ""} />
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
