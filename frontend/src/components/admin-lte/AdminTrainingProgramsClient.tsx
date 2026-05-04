"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createTrainingProgram,
  deleteTrainingProgram,
  fetchTrainingProgramPage,
  updateTrainingProgram,
} from "@/lib/api/trainingPrograms";
import type {
  ApiErrorBody,
  TrainingProgram,
  TrainingProgramPayload,
} from "@/lib/types/hrEntities";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type FormState = {
  programCode: string;
  programName: string;
  totalCredits: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  programCode: "",
  programName: "",
  totalCredits: "",
  description: "",
};

export default function AdminTrainingProgramsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);
  const [rows, setRows] = useState<TrainingProgram[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ draft khi query URL đổi
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrainingProgramPage(page, 10, "id,desc", qParam || undefined);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu theo filter/page
    void load();
  }, [load]);

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

  function openEdit(row: TrainingProgram) {
    setEditingId(row.id);
    setForm({
      programCode: row.programCode,
      programName: row.programName,
      totalCredits: String(row.totalCredits),
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
      const credits = Number(form.totalCredits.trim());
      if (!Number.isFinite(credits) || !Number.isInteger(credits) || credits < 1) {
        setFieldErrors({ totalCredits: "Tổng tín chỉ phải là số nguyên dương." });
        return;
      }
      if (credits > 300) {
        setFieldErrors({ totalCredits: "Tổng tín chỉ tối đa 300." });
        return;
      }
      const payload: TrainingProgramPayload = {
        programCode: form.programCode.trim(),
        programName: form.programName.trim(),
        totalCredits: credits,
        description: form.description.trim() || undefined,
      };
      if (editingId == null) await createTrainingProgram(payload);
      else await updateTrainingProgram(editingId, payload);
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
    if (!confirm("Xóa chương trình đào tạo này?")) return;
    try {
      await deleteTrainingProgram(id);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xóa thất bại");
    }
  }

  return (
    <>
      <ContentHeader
        title="Chương trình đào tạo"
        titleIcon="fa-solid fa-diagram-project"
        breadcrumbs={[{ label: "Trang chủ", href: "/admin" }, { label: "Chương trình đào tạo" }]}
      />

      <LteCard
        title="Danh sách chương trình đào tạo"
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
            placeholder="Tìm theo mã, tên chương trình hoặc mô tả..."
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
            <p className="text-sm font-medium">Đang tải...</p>
          </div>
        ) : (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mã CTĐT</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tên chương trình</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Tổng tín chỉ</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">Mô tả</th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-14 text-center text-[#6c757d]">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">{row.programCode}</td>
                        <td className="px-4 py-3 font-medium text-[#2c3e50]">{row.programName}</td>
                        <td className="px-4 py-3 tabular-nums text-[#495057]">{row.totalCredits}</td>
                        <td className="max-w-sm truncate px-4 py-3 text-[#6c757d]">{row.description || "—"}</td>
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
          <div className="lte-modal-panel max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <h4 className="text-lg font-semibold text-[#2c3e50]">
                {editingId == null ? "Thêm chương trình đào tạo" : "Sửa chương trình đào tạo"}
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
                label="Mã chương trình"
                error={fieldErrors.programCode}
                input={<input required className="lte-input w-full" value={form.programCode} onChange={(e) => setForm((f) => ({ ...f, programCode: e.target.value }))} />}
              />
              <Field
                label="Tên chương trình"
                error={fieldErrors.programName}
                input={<input required className="lte-input w-full" value={form.programName} onChange={(e) => setForm((f) => ({ ...f, programName: e.target.value }))} />}
              />
              <Field
                label="Tổng số tín chỉ"
                error={fieldErrors.totalCredits}
                input={<input required type="number" min={1} max={300} className="lte-input w-full" value={form.totalCredits} onChange={(e) => setForm((f) => ({ ...f, totalCredits: e.target.value }))} />}
              />
              <Field
                label="Mô tả"
                error={fieldErrors.description}
                input={<textarea className="lte-input min-h-[88px] w-full resize-y" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />}
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
