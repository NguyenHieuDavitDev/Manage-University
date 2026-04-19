"use client";

import { RoleSearchSuggestInput } from "@/components/role/RoleSearchSuggestInput";
import { FaIcon } from "@/components/FaIcon";
import {
  createRole,
  deleteRole,
  fetchRolePage,
  updateRole,
} from "@/lib/api/roles";
import type { ApiErrorBody, Role, RolePayload } from "@/lib/types/role";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

const emptyForm: RolePayload = {
  roleCode: "",
  roleName: "",
  description: "",
};

export default function AdminRolesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);

  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchRolePage>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RolePayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô tìm với query khi đổi URL
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchRolePage(page, 10, "id,desc", qParam || undefined);
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, qParam]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải khi đổi trang / từ khóa
    void load();
  }, [load]);

  function pushQuery(nextPage: number, nextQ: string) {
    const p = new URLSearchParams();
    p.set("page", String(nextPage));
    const t = nextQ.trim();
    if (t) p.set("q", t);
    router.push(`?${p.toString()}`);
  }

  function setPage(p: number) {
    pushQuery(p, qParam);
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    pushQuery(0, draft);
  }

  function clearSearch() {
    setDraft("");
    router.push("?page=0");
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(r: Role) {
    setEditingId(r.id);
    setForm({
      roleCode: r.roleCode,
      roleName: r.roleName,
      description: r.description ?? "",
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSaving(true);
    const payload: RolePayload = {
      roleCode: form.roleCode.trim(),
      roleName: form.roleName.trim(),
      description: form.description?.trim() || undefined,
    };
    try {
      if (editingId == null) {
        await createRole(payload);
      } else {
        await updateRole(editingId, payload);
      }
      closeModal();
      await load();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) {
        setFieldErrors(er.apiError.details);
      }
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa vai trò này?")) return;
    try {
      await deleteRole(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  return (
    <>
      <ContentHeader
        title="Quản lý vai trò"
        titleIcon="fa-solid fa-user-shield"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Vai trò" },
        ]}
      />

      <LteCard
        title="Danh sách vai trò"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button
            type="button"
            onClick={openCreate}
            className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
          >
            <FaIcon icon="fa-solid fa-plus" />
            Thêm vai trò
          </button>
        }
      >
        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <RoleSearchSuggestInput
            name="q"
            value={draft}
            onChange={setDraft}
            onPickSuggestion={(s) => {
              const term = `${s.roleCode} ${s.roleName}`.trim();
              setDraft(term);
              pushQuery(0, term);
            }}
            placeholder="Tìm theo mã, tên hoặc mô tả (tiếng Việt)…"
          />
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {qParam && (
              <button
                type="button"
                onClick={clearSearch}
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
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải…</p>
          </div>
        )}
        {!loading && data && (
          <>
            <div className="lte-table-wrap overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-tag" className="text-[#3c8dbc]" />
                        Mã vai trò
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-signature" className="text-[#3c8dbc]" />
                        Tên hiển thị
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-align-left" className="text-[#3c8dbc]" />
                        Mô tả
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 text-right font-semibold">
                      <span className="inline-flex items-center justify-end gap-2">
                        <FaIcon icon="fa-solid fa-gear" className="text-[#3c8dbc]" />
                        Thao tác
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-14 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-[#6c757d]">
                          <FaIcon icon="fa-solid fa-filter-circle-xmark" className="text-4xl text-[#dee2e6]" />
                          <p className="text-sm font-medium text-[#495057]">
                            Không có vai trò phù hợp
                          </p>
                          <p className="text-xs">
                            Thử từ khóa khác hoặc thêm vai trò mới.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.content.map((r) => (
                    <tr key={r.id} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">
                        {r.roleCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#2c3e50]">{r.roleName}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-[#6c757d]">
                        {r.description || "—"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#3c8dbc] hover:bg-[#3c8dbc]/10"
                        >
                          <FaIcon icon="fa-solid fa-pen-to-square" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(r.id)}
                          className="lte-btn lte-btn-danger lte-btn-sm"
                        >
                          <FaIcon icon="fa-solid fa-trash-can" />
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.totalPages > 1 && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
                <span className="inline-flex items-center gap-2">
                  <FaIcon icon="fa-solid fa-file-lines" className="text-[#adb5bd]" />
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} vai trò
                  {qParam && (
                    <span className="rounded-full bg-[#3c8dbc]/10 px-2 py-0.5 text-xs text-[#3c8dbc]">
                      Lọc: &quot;{qParam}&quot;
                    </span>
                  )}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={data.first}
                    onClick={() => setPage(page - 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    <FaIcon icon="fa-solid fa-chevron-left" />
                    Trước
                  </button>
                  <button
                    type="button"
                    disabled={data.last}
                    onClick={() => setPage(page + 1)}
                    className="lte-btn lte-btn-ghost lte-btn-sm disabled:pointer-events-none disabled:opacity-40"
                  >
                    Sau
                    <FaIcon icon="fa-solid fa-chevron-right" />
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
            aria-labelledby="role-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3c8dbc]/12 text-[#3c8dbc]">
                  <FaIcon
                    icon={
                      editingId == null ? "fa-solid fa-plus" : "fa-solid fa-pen-to-square"
                    }
                    className="text-lg"
                  />
                </span>
                <h4 id="role-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                  {editingId == null ? "Thêm vai trò" : "Sửa vai trò"}
                </h4>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#6c757d] hover:bg-[#f1f3f5]"
                aria-label="Đóng"
              >
                <FaIcon icon="fa-solid fa-xmark" className="text-xl" />
              </button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
              {formError && (
                <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <FaIcon icon="fa-solid fa-triangle-exclamation" className="mt-0.5" />
                  {formError}
                </p>
              )}
              <Field
                label="Mã vai trò"
                labelIcon="fa-solid fa-tag"
                error={fieldErrors.roleCode}
                hint="Mã định danh (thường viết không dấu, không trùng)."
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.roleCode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, roleCode: e.target.value }))
                    }
                  />
                }
              />
              <Field
                label="Tên vai trò"
                labelIcon="fa-solid fa-signature"
                error={fieldErrors.roleName}
                hint="Có thể dùng tiếng Việt có dấu."
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.roleName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, roleName: e.target.value }))
                    }
                  />
                }
              />
              <Field
                label="Mô tả"
                labelIcon="fa-solid fa-align-left"
                error={fieldErrors.description}
                input={
                  <textarea
                    className="lte-input min-h-[88px] w-full resize-y"
                    value={form.description ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                }
              />
              <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="lte-btn lte-btn-ghost lte-btn-sm min-w-[5.5rem]"
                >
                  <FaIcon icon="fa-solid fa-ban" />
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="lte-btn lte-btn-primary lte-btn-sm min-w-[6.5rem]"
                >
                  {saving ? (
                    <>
                      <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                      Đang lưu…
                    </>
                  ) : (
                    <>
                      <FaIcon icon="fa-solid fa-floppy-disk" />
                      Lưu
                    </>
                  )}
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
  labelIcon,
  hint,
  input,
  error,
}: {
  label: string;
  labelIcon?: string;
  hint?: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#495057]">
        {labelIcon && (
          <FaIcon icon={labelIcon} className="text-[#3c8dbc] opacity-90" />
        )}
        {label}
      </label>
      {hint && !error && (
        <p className="mb-1.5 text-xs text-[#6c757d]">{hint}</p>
      )}
      {input}
      {error && (
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <FaIcon icon="fa-solid fa-circle-xmark" />
          {error}
        </p>
      )}
    </div>
  );
}
