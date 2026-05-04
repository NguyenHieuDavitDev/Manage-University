"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createTuitionRate,
  deleteTuitionRate,
  fetchTuitionRatePage,
  updateTuitionRate,
} from "@/lib/api/tuitionRates";
import { fetchTrainingProgramPage } from "@/lib/api/trainingPrograms";
import type {
  ApiErrorBody,
  TrainingProgram,
  TuitionRate,
  TuitionRatePayload,
} from "@/lib/types/hrEntities";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = {
  tuitionCode: string;
  tuitionName: string;
  trainingProgramId: string;
  feePerCredit: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  tuitionCode: "",
  tuitionName: "",
  trainingProgramId: "",
  feePerCredit: "",
  description: "",
};

function parsePositiveDecimal(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n <= 0) return Number.NaN;
  return n;
}

export default function AdminTuitionRatesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);
  const [rows, setRows] = useState<TuitionRate[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô tìm kiếm khi query URL thay đổi
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTuitionRatePage(page, 10, "id,desc", qParam || undefined);
      setRows(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (e) {
      setRows([]);
      setTotalPages(0);
      setTotalElements(0);
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }, [page, qParam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu khi bộ lọc đổi
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bật trạng thái loading trước khi gọi API
    setLoadingPrograms(true);
    void (async () => {
      try {
        const data = await fetchTrainingProgramPage(0, 500, "programName,asc");
        if (!cancelled) setTrainingPrograms(data.content);
      } catch {
        if (!cancelled) setTrainingPrograms([]);
      } finally {
        if (!cancelled) setLoadingPrograms(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function pushQuery(nextPage: number, nextQ: string) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    router.push(`?${p.toString()}`);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(row: TuitionRate) {
    setEditingId(row.id);
    setForm({
      tuitionCode: row.tuitionCode,
      tuitionName: row.tuitionName,
      trainingProgramId: row.trainingProgramId == null ? "" : String(row.trainingProgramId),
      feePerCredit: row.feePerCredit == null ? "" : String(row.feePerCredit),
      description: row.description ?? "",
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
      const feePerCredit = parsePositiveDecimal(form.feePerCredit);
      if (Number.isNaN(feePerCredit)) {
        setFieldErrors({ feePerCredit: "Nhập số dương hợp lệ." });
        return;
      }
      const trainingProgramId = Number(form.trainingProgramId.trim());
      if (!Number.isInteger(trainingProgramId) || trainingProgramId <= 0) {
        setFieldErrors({ trainingProgramId: "Vui lòng chọn chương trình đào tạo." });
        return;
      }
      if (feePerCredit == null) {
        setFieldErrors({ feePerCredit: "Nhập đơn giá theo tín chỉ." });
        return;
      }
      const payload: TuitionRatePayload = {
        tuitionCode: form.tuitionCode.trim(),
        tuitionName: form.tuitionName.trim(),
        trainingProgramId,
        feePerCredit,
        description: form.description.trim() || undefined,
      };
      if (editingId == null) {
        await createTuitionRate(payload);
      } else {
        await updateTuitionRate(editingId, payload);
      }
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
    if (!confirm("Xóa mức học phí này?")) return;
    try {
      await deleteTuitionRate(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  }

  const selectedProgram =
    form.trainingProgramId.trim().length > 0
      ? trainingPrograms.find((p) => String(p.id) === form.trainingProgramId.trim()) ?? null
      : null;
  const previewTotalTuition =
    selectedProgram && form.feePerCredit.trim()
      ? Number(form.feePerCredit) * selectedProgram.totalCredits
      : null;

  return (
    <>
      <ContentHeader
        title="Mức học phí theo tín chỉ / chương trình"
        titleIcon="fa-solid fa-money-bill-trend-up"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Mức học phí" }]}
      />

      <LteCard
        title="Danh sách mức học phí"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button type="button" onClick={openCreate} className="lte-btn lte-btn-primary lte-btn-sm shadow-sm">
            <FaIcon icon="fa-solid fa-plus" />
            Thêm mới
          </button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            pushQuery(0, draft);
          }}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            className="lte-input min-w-0 flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo mã, tên, chương trình đào tạo hoặc mô tả..."
          />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {qParam && (
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  pushQuery(0, "");
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
            <p className="text-sm font-medium">Đang tải…</p>
          </div>
        ) : (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mã</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tên mức phí</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      Chương trình đào tạo
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Phí / tín chỉ</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      Tổng học phí
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mô tả</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-14 text-center text-[#6c757d]">
                        <FaIcon icon="fa-solid fa-filter-circle-xmark" className="mb-2 text-4xl" />
                        <p className="text-sm font-medium text-[#495057]">Không có dữ liệu</p>
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">{row.tuitionCode}</td>
                        <td className="px-4 py-3 font-medium text-[#2c3e50]">{row.tuitionName}</td>
                        <td className="px-4 py-3 text-[#495057]">
                          <div className="font-medium">{row.trainingProgramName || "—"}</div>
                          <div className="text-xs text-[#6c757d]">
                            {row.trainingProgramCode || ""}{" "}
                            {row.trainingProgramTotalCredits != null
                              ? `(${row.trainingProgramTotalCredits} tín chỉ)`
                              : ""}
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[#495057]">
                          {row.feePerCredit != null ? row.feePerCredit.toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[#495057]">
                          {row.totalTuition != null ? row.totalTuition.toLocaleString("vi-VN") : "—"}
                        </td>
                        <td className="max-w-xs truncate px-4 py-3 text-[#6c757d]">{row.description || "—"}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
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
                    onClick={() => pushQuery(page - 1, qParam)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={page + 1 >= totalPages}
                    onClick={() => pushQuery(page + 1, qParam)}
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

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="lte-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 className="text-lg font-semibold text-[#2c3e50]">
                {editingId == null ? "Thêm mức học phí" : "Sửa mức học phí"}
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
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
                label="Mã mức phí"
                error={fieldErrors.tuitionCode}
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.tuitionCode}
                    onChange={(e) => setForm((f) => ({ ...f, tuitionCode: e.target.value }))}
                  />
                }
              />
              <Field
                label="Tên mức phí"
                error={fieldErrors.tuitionName}
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.tuitionName}
                    onChange={(e) => setForm((f) => ({ ...f, tuitionName: e.target.value }))}
                  />
                }
              />
              <Field
                label="Chương trình đào tạo"
                error={fieldErrors.trainingProgramId}
                input={
                  <select
                    required
                    className="lte-input w-full"
                    value={form.trainingProgramId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, trainingProgramId: e.target.value }))
                    }
                  >
                    <option value="">
                      {loadingPrograms
                        ? "Đang tải chương trình đào tạo..."
                        : "— Chọn chương trình đào tạo —"}
                    </option>
                    {trainingPrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programName} ({p.programCode}) - {p.totalCredits} tín chỉ
                      </option>
                    ))}
                  </select>
                }
              />
              <Field
                label="Đơn giá theo tín chỉ"
                error={fieldErrors.feePerCredit}
                input={
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="lte-input w-full"
                    value={form.feePerCredit}
                    onChange={(e) => setForm((f) => ({ ...f, feePerCredit: e.target.value }))}
                    placeholder="Ví dụ: 450000"
                  />
                }
              />
              <div className="rounded-lg border border-[#e3e8ec] bg-[#f8fafc] px-3 py-2 text-sm text-[#495057]">
                <span className="font-semibold">Tổng học phí (tự tính): </span>
                {previewTotalTuition != null && Number.isFinite(previewTotalTuition)
                  ? previewTotalTuition.toLocaleString("vi-VN")
                  : "Chọn CTĐT và nhập đơn giá để xem"}
              </div>
              <Field
                label="Mô tả"
                error={fieldErrors.description}
                input={
                  <textarea
                    className="lte-input min-h-[88px] w-full resize-y"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                }
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
    </>
  );
}

function Field({
  label,
  input,
  error,
}: {
  label: string;
  input: React.ReactNode;
  error?: string;
}) {
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
