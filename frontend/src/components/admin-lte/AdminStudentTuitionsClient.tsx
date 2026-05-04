"use client";

import { FaIcon } from "@/components/FaIcon";
import { fetchUserPage } from "@/lib/api/users";
import {
  createStudentTuition,
  deleteStudentTuition,
  fetchAdminPaymentHistory,
  fetchStudentTuitionPage,
  generateStudentTuitionEightSemesters,
  updateStudentTuition,
} from "@/lib/api/studentTuitions";
import { fetchTuitionRatePage } from "@/lib/api/tuitionRates";
import type {
  ApiErrorBody,
  StudentTuition,
  StudentTuitionGeneratePlanPayload,
  StudentTuitionPaymentHistory,
  StudentTuitionPayload,
  TuitionRate,
} from "@/lib/types/hrEntities";
import type { User } from "@/lib/types/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = {
  userId: string;
  tuitionRateId: string;
  academicYear: string;
  semester: string;
  totalCredits: string;
  amountDue: string;
  amountPaid: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  userId: "",
  tuitionRateId: "",
  academicYear: "",
  semester: "1",
  totalCredits: "",
  amountDue: "",
  amountPaid: "0",
  notes: "",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "UNPAID", label: "Chưa đóng" },
  { value: "PARTIAL", label: "Đóng một phần" },
  { value: "PAID", label: "Đã đóng đủ" },
] as const;

function statusLabel(status: string): string {
  const up = status.toUpperCase();
  if (up === "PAID") return "Đã đóng đủ";
  if (up === "PARTIAL") return "Đóng một phần";
  if (up === "UNPAID") return "Chưa đóng";
  return status;
}

function paymentMethodLabel(method: string): string {
  const up = method.toUpperCase();
  if (up === "MOMO") return "MoMo";
  if (up === "MANUAL") return "Thủ công";
  if (up === "BANK_TRANSFER") return "Chuyển khoản";
  if (up === "CARD") return "Thẻ";
  return method;
}

function parseNonNegative(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return Number.NaN;
  return n;
}

function parsePositive(raw: string): number | null {
  const n = parseNonNegative(raw);
  if (n == null) return null;
  if (Number.isNaN(n) || n <= 0) return Number.NaN;
  return n;
}

export default function AdminStudentTuitionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();
  const userIdParam = (searchParams.get("userId") || "").trim();
  const yearParam = (searchParams.get("academicYear") || "").trim();
  const semesterParamRaw = (searchParams.get("semester") || "").trim();
  const semesterParam = semesterParamRaw ? Number(semesterParamRaw) : null;
  const paymentStatusParam = (searchParams.get("paymentStatus") || "").trim().toUpperCase();

  const [draftQ, setDraftQ] = useState(qParam);
  const [draftUserId, setDraftUserId] = useState(userIdParam);
  const [draftYear, setDraftYear] = useState(yearParam);
  const [draftSemester, setDraftSemester] = useState(semesterParamRaw);
  const [draftPaymentStatus, setDraftPaymentStatus] = useState(paymentStatusParam);

  const [rows, setRows] = useState<StudentTuition[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<StudentTuitionPaymentHistory[]>([]);

  const [tuitionRates, setTuitionRates] = useState<TuitionRate[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [studentOptions, setStudentOptions] = useState<User[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState({
    userId: "",
    tuitionRateId: "",
    startYear: String(new Date().getFullYear()),
    endYear: String(new Date().getFullYear() + 4),
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ draft theo query URL
    setDraftQ(qParam);
    setDraftUserId(userIdParam);
    setDraftYear(yearParam);
    setDraftSemester(semesterParamRaw);
    setDraftPaymentStatus(paymentStatusParam);
  }, [paymentStatusParam, qParam, semesterParamRaw, userIdParam, yearParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, history] = await Promise.all([
        fetchStudentTuitionPage(
          page,
          10,
          "id,desc",
          qParam || undefined,
          userIdParam || undefined,
          yearParam || undefined,
          semesterParam,
          paymentStatusParam || undefined
        ),
        fetchAdminPaymentHistory(),
      ]);
      setRows(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPaymentHistory(history);
    } catch (e) {
      setRows([]);
      setTotalPages(0);
      setTotalElements(0);
      setPaymentHistory([]);
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [page, paymentStatusParam, qParam, semesterParam, userIdParam, yearParam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải danh sách khi filter đổi
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bật trạng thái loading trước khi gọi API
    setLoadingRates(true);
    void (async () => {
      try {
        const data = await fetchTuitionRatePage(0, 200, "id,desc");
        if (!cancelled) setTuitionRates(data.content);
      } catch {
        if (!cancelled) setTuitionRates([]);
      } finally {
        if (!cancelled) setLoadingRates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bật trạng thái loading trước khi gọi API
    setLoadingStudents(true);
    void (async () => {
      try {
        const data = await fetchUserPage(0, 500, "fullName,asc");
        const students = data.content.filter((u) => {
          const roles = u.roles ?? [];
          if (roles.length === 0) return false;
          return roles.some((r) => {
            const code = r.roleCode?.trim().toUpperCase() || "";
            return code === "STUDENT" || code === "ROLE_STUDENT";
          });
        });
        if (!cancelled) setStudentOptions(students);
      } catch {
        if (!cancelled) setStudentOptions([]);
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function pushQuery(nextPage: number, next: {
    q?: string;
    userId?: string;
    academicYear?: string;
    semester?: string;
    paymentStatus?: string;
  }) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const q = (next.q ?? draftQ).trim();
    const userId = (next.userId ?? draftUserId).trim();
    const year = (next.academicYear ?? draftYear).trim();
    const semester = (next.semester ?? draftSemester).trim();
    const paymentStatus = (next.paymentStatus ?? draftPaymentStatus).trim().toUpperCase();
    if (q) p.set("q", q);
    if (userId) p.set("userId", userId);
    if (year) p.set("academicYear", year);
    if (semester) p.set("semester", semester);
    if (paymentStatus) p.set("paymentStatus", paymentStatus);
    router.push(`?${p.toString()}`);
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      academicYear: yearParam || "",
      semester: semesterParamRaw || "1",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openGeneratePlan() {
    setPlanError(null);
    setPlanForm({
      userId: draftUserId || "",
      tuitionRateId: "",
      startYear: String(new Date().getFullYear()),
      endYear: String(new Date().getFullYear() + 4),
    });
    setPlanModalOpen(true);
  }

  function openEdit(row: StudentTuition) {
    setEditingId(row.id);
    setForm({
      userId: row.userId,
      tuitionRateId: row.tuitionRateId == null ? "" : String(row.tuitionRateId),
      academicYear: row.academicYear,
      semester: String(row.semester),
      totalCredits: row.totalCredits == null ? "" : String(row.totalCredits),
      amountDue: String(row.amountDue),
      amountPaid: String(row.amountPaid),
      notes: row.notes ?? "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    try {
      const due = parsePositive(form.amountDue);
      const paid = parseNonNegative(form.amountPaid);
      if (Number.isNaN(due) || due == null) {
        setFieldErrors({ amountDue: "Số tiền phải đóng phải là số dương." });
        return;
      }
      if (Number.isNaN(paid) || paid == null) {
        setFieldErrors({ amountPaid: "Số tiền đã đóng phải là số >= 0." });
        return;
      }
      if (paid > due) {
        setFieldErrors({ amountPaid: "Số tiền đã đóng không được lớn hơn số phải đóng." });
        return;
      }
      const semester = Number(form.semester);
      if (![1, 2, 3].includes(semester)) {
        setFieldErrors({ semester: "Học kỳ chỉ nhận 1, 2 hoặc 3." });
        return;
      }
      const credits = form.totalCredits.trim() ? Number(form.totalCredits.trim()) : null;
      if (credits != null && (!Number.isInteger(credits) || credits < 0)) {
        setFieldErrors({ totalCredits: "Tổng tín chỉ phải là số nguyên >= 0." });
        return;
      }
      const payload: StudentTuitionPayload = {
        userId: form.userId.trim(),
        tuitionRateId: form.tuitionRateId.trim() ? Number(form.tuitionRateId.trim()) : undefined,
        academicYear: form.academicYear.trim(),
        semester,
        totalCredits: credits ?? undefined,
        amountDue: due,
        amountPaid: paid,
        notes: form.notes.trim() || undefined,
      };
      if (editingId == null) await createStudentTuition(payload);
      else await updateStudentTuition(editingId, payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      const er = e as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(id: number) {
    if (!confirm("Xóa học phí sinh viên này?")) return;
    try {
      await deleteStudentTuition(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  }

  async function submitGeneratePlan(e: React.FormEvent) {
    e.preventDefault();
    setPlanError(null);
    setPlanSaving(true);
    try {
      const tuitionRateId = Number(planForm.tuitionRateId);
      const startYear = Number(planForm.startYear);
      const endYear = Number(planForm.endYear);
      if (!planForm.userId.trim()) {
        setPlanError("Vui lòng chọn sinh viên.");
        return;
      }
      if (!Number.isInteger(tuitionRateId) || tuitionRateId <= 0) {
        setPlanError("Vui lòng chọn mức học phí.");
        return;
      }
      if (!Number.isInteger(startYear) || !Number.isInteger(endYear)) {
        setPlanError("Năm bắt đầu/kết thúc không hợp lệ.");
        return;
      }
      if (endYear - startYear !== 4) {
        setPlanError("Năm kết thúc phải cách năm bắt đầu đúng 4 năm.");
        return;
      }
      const payload: StudentTuitionGeneratePlanPayload = {
        userId: planForm.userId.trim(),
        tuitionRateId,
        startYear,
        endYear,
      };
      await generateStudentTuitionEightSemesters(payload);
      setPlanModalOpen(false);
      await load();
    } catch (e) {
      const er = e as Error & { apiError?: ApiErrorBody };
      setPlanError(er.message || "Sinh kế hoạch thất bại");
    } finally {
      setPlanSaving(false);
    }
  }

  return (
    <>
      <ContentHeader
        title="Học phí sinh viên theo học kỳ"
        titleIcon="fa-solid fa-file-invoice-dollar"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Học phí sinh viên" }]}
      />
      <LteCard
        id="payment-history-stats"
        title="Danh sách học phí sinh viên"
        titleIcon="fa-solid fa-list-check"
        tools={
          <div className="flex gap-2">
            <button type="button" onClick={openGeneratePlan} className="lte-btn lte-btn-ghost lte-btn-sm border border-[#3c8dbc] text-[#2f7494]">
              <FaIcon icon="fa-solid fa-calendar-plus" />
              Chia đều 8 học kỳ
            </button>
            <button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm shadow-sm">
              <FaIcon icon="fa-solid fa-plus" />
              Thêm mới
            </button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushQuery(0, {});
          }}
          className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-5"
        >
          <input className="lte-input" placeholder="Từ khóa..." value={draftQ} onChange={(e) => setDraftQ(e.target.value)} />
          <input className="lte-input" placeholder="User ID (UUID)" value={draftUserId} onChange={(e) => setDraftUserId(e.target.value)} />
          <input className="lte-input" placeholder="Năm học (VD: 2025-2026)" value={draftYear} onChange={(e) => setDraftYear(e.target.value)} />
          <select className="lte-input" value={draftSemester} onChange={(e) => setDraftSemester(e.target.value)}>
            <option value="">Tất cả học kỳ</option>
            <option value="1">Học kỳ 1</option>
            <option value="2">Học kỳ 2</option>
            <option value="3">Học kỳ 3</option>
          </select>
          <select className="lte-input" value={draftPaymentStatus} onChange={(e) => setDraftPaymentStatus(e.target.value)}>
            {PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="md:col-span-5 flex gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Lọc dữ liệu
            </button>
            {(qParam || userIdParam || yearParam || semesterParamRaw || paymentStatusParam) && (
              <button
                type="button"
                onClick={() => {
                  setDraftQ("");
                  setDraftUserId("");
                  setDraftYear("");
                  setDraftSemester("");
                  setDraftPaymentStatus("");
                  pushQuery(0, { q: "", userId: "", academicYear: "", semester: "", paymentStatus: "" });
                }}
                className="lte-btn lte-btn-ghost lte-btn-sm"
              >
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

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải...</p>
          </div>
        ) : (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Sinh viên</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Năm học</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">HK</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Mức phí</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Phải đóng</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Đã đóng</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Trạng thái</th>
                    <th className="border-b border-[#e3e8ec] px-3 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-[#6c757d]">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0f3f6]">
                        <td className="px-3 py-3">
                          <div className="font-medium text-[#2c3e50]">{row.userFullName || "—"}</div>
                          <div className="font-mono text-xs text-[#6c757d]">{row.userId}</div>
                        </td>
                        <td className="px-3 py-3">{row.academicYear}</td>
                        <td className="px-3 py-3 text-center">{row.semester}</td>
                        <td className="px-3 py-3">{row.tuitionRateName || "—"}</td>
                        <td className="px-3 py-3 tabular-nums">{row.amountDue.toLocaleString("vi-VN")}</td>
                        <td className="px-3 py-3 tabular-nums">{row.amountPaid.toLocaleString("vi-VN")}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-[#3c8dbc]/12 px-2 py-1 text-xs font-medium text-[#2f7494]">
                            {statusLabel(row.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
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
                            onClick={() => void removeRow(row.id)}
                            className="lte-btn lte-btn-danger lte-btn-sm"
                          >
                            <FaIcon icon="fa-solid fa-trash-can" />
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
                <span>
                  Trang {page + 1}/{totalPages} — {totalElements} bản ghi
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 0}
                    onClick={() => pushQuery(page - 1, {})}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => pushQuery(page + 1, {})}
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

      <div className="mt-5">
        <LteCard
          id="payment-history-stats"
          title="Thống kê lịch sử đã thanh toán thành công"
          titleIcon="fa-solid fa-chart-line"
        >
          {(() => {
            const totalPaid = paymentHistory.reduce((sum, p) => sum + p.amount, 0);
            const totalInvoices = paymentHistory.filter((p) => p.invoiceId != null).length;
            const missingInvoices = paymentHistory.length - totalInvoices;
            return (
              <>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Tổng giao dịch thành công</p>
                    <p className="mt-1 text-xl font-bold text-emerald-800">
                      {paymentHistory.length.toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Tổng tiền đã thu</p>
                    <p className="mt-1 text-xl font-bold text-sky-800">
                      {totalPaid.toLocaleString("vi-VN")} VND
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Hóa đơn đã lưu / thiếu</p>
                    <p className="mt-1 text-xl font-bold text-amber-800">
                      {totalInvoices.toLocaleString("vi-VN")} / {missingInvoices.toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>

                <div className="lte-table-wrap overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Thời gian</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Sinh viên</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Năm học / HK</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Phương thức</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Số tiền</th>
                        <th className="border-b border-[#e3e8ec] px-3 py-3 font-semibold">Hóa đơn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-12 text-center text-[#6c757d]">
                            Chưa có giao dịch thanh toán thành công
                          </td>
                        </tr>
                      ) : (
                        paymentHistory.slice(0, 200).map((p) => (
                          <tr key={p.paymentId} className="border-b border-[#f0f3f6]">
                            <td className="px-3 py-3">{new Date(p.createdAt).toLocaleString("vi-VN")}</td>
                            <td className="px-3 py-3">
                              <div className="font-medium text-[#2c3e50]">{p.userFullName || "—"}</div>
                              <div className="font-mono text-xs text-[#6c757d]">{p.userId}</div>
                            </td>
                            <td className="px-3 py-3">
                              {p.academicYear} / HK{p.semester}
                            </td>
                            <td className="px-3 py-3">{paymentMethodLabel(p.paymentMethod)}</td>
                            <td className="px-3 py-3 tabular-nums">{p.amount.toLocaleString("vi-VN")} VND</td>
                            <td className="px-3 py-3">
                              {p.invoiceNo ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                  {p.invoiceNo}
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                                  Thiếu hóa đơn
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </LteCard>
      </div>

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="lte-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 className="text-lg font-semibold text-[#2c3e50]">
                {editingId == null ? "Thêm học phí sinh viên" : "Sửa học phí sinh viên"}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <form onSubmit={(e) => void submitForm(e)} className="space-y-4 p-5">
              {formError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                  {formError}
                </p>
              )}
              <Field
                label="Sinh viên"
                error={fieldErrors.userId}
                input={
                  <select
                    required
                    className="lte-input w-full"
                    value={form.userId}
                    onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  >
                    <option value="">{loadingStudents ? "Đang tải danh sách sinh viên..." : "— Chọn sinh viên —"}</option>
                    {form.userId &&
                      !studentOptions.some((u) => u.id === form.userId) && (
                        <option value={form.userId}>
                          {form.userId} (không còn trong danh sách lọc)
                        </option>
                      )}
                    {studentOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} - {u.username}
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Năm học"
                error={fieldErrors.academicYear}
                input={<input required className="lte-input w-full" placeholder="VD: 2025-2026" value={form.academicYear} onChange={(e) => setForm((f) => ({ ...f, academicYear: e.target.value }))} />}
              />
              <Field
                label="Học kỳ"
                error={fieldErrors.semester}
                input={
                  <select className="lte-input w-full" value={form.semester} onChange={(e) => setForm((f) => ({ ...f, semester: e.target.value }))}>
                    <option value="1">Học kỳ 1</option>
                    <option value="2">Học kỳ 2</option>
                    <option value="3">Học kỳ 3</option>
                  </select>
                }
              />
              <Field
                label="Mức học phí áp dụng"
                error={fieldErrors.tuitionRateId}
                input={
                  <select className="lte-input w-full" value={form.tuitionRateId} onChange={(e) => setForm((f) => ({ ...f, tuitionRateId: e.target.value }))}>
                    <option value="">{loadingRates ? "Đang tải..." : "— Không gán —"}</option>
                    {tuitionRates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.tuitionName} ({r.tuitionCode})
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Tổng tín chỉ"
                error={fieldErrors.totalCredits}
                input={<input type="number" min={0} className="lte-input w-full" value={form.totalCredits} onChange={(e) => setForm((f) => ({ ...f, totalCredits: e.target.value }))} />}
              />
              <Field
                label="Số tiền phải đóng"
                error={fieldErrors.amountDue}
                input={<input required type="number" min={0} step="0.01" className="lte-input w-full" value={form.amountDue} onChange={(e) => setForm((f) => ({ ...f, amountDue: e.target.value }))} />}
              />
              <Field
                label="Số tiền đã đóng"
                error={fieldErrors.amountPaid}
                input={<input required type="number" min={0} step="0.01" className="lte-input w-full" value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} />}
              />
              <Field
                label="Ghi chú"
                error={fieldErrors.notes}
                input={<textarea className="lte-input min-h-[88px] w-full resize-y" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />}
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="lte-btn lte-btn-ghost lte-btn-sm">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {planModalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div className="lte-modal-panel w-full max-w-lg rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 className="text-lg font-semibold text-[#2c3e50]">Chia học phí đều 8 học kỳ (4 năm)</h4>
              <button
                type="button"
                onClick={() => setPlanModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <form onSubmit={(e) => void submitGeneratePlan(e)} className="space-y-4 p-5">
              {planError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                  {planError}
                </p>
              )}
              <Field
                label="Sinh viên"
                input={
                  <select
                    required
                    className="lte-input w-full"
                    value={planForm.userId}
                    onChange={(e) => setPlanForm((f) => ({ ...f, userId: e.target.value }))}
                  >
                    <option value="">— Chọn sinh viên —</option>
                    {studentOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} - {u.username}
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Mức học phí"
                input={
                  <select
                    required
                    className="lte-input w-full"
                    value={planForm.tuitionRateId}
                    onChange={(e) => setPlanForm((f) => ({ ...f, tuitionRateId: e.target.value }))}
                  >
                    <option value="">{loadingRates ? "Đang tải..." : "— Chọn mức học phí —"}</option>
                    {tuitionRates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.tuitionName} ({r.tuitionCode})
                      </option>
                    ))}
                  </select>
                }
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Năm bắt đầu"
                  input={
                    <input
                      required
                      type="number"
                      className="lte-input w-full"
                      value={planForm.startYear}
                      onChange={(e) => setPlanForm((f) => ({ ...f, startYear: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Năm kết thúc"
                  input={
                    <input
                      required
                      type="number"
                      className="lte-input w-full"
                      value={planForm.endYear}
                      onChange={(e) => setPlanForm((f) => ({ ...f, endYear: e.target.value }))}
                    />
                  }
                />
              </div>
              <p className="text-xs text-[#6c757d]">
                Hệ thống sẽ tự sinh 8 bản ghi học phí (mỗi năm 2 học kỳ) và chia đều đến khi đủ tổng học phí.
              </p>
              <div className="flex justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={() => setPlanModalOpen(false)} className="lte-btn lte-btn-ghost lte-btn-sm">
                  Hủy
                </button>
                <button type="submit" disabled={planSaving} className="lte-btn lte-btn-primary lte-btn-sm">
                  {planSaving ? "Đang sinh..." : "Sinh kế hoạch 8 học kỳ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, input, error }: { label: string; input: React.ReactNode; error?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#495057]">{label}</label>
      {input}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">
          <FaIcon icon="fa-solid fa-circle-xmark" className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
