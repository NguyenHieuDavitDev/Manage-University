"use client";

import { PermissionSearchSuggestInput } from "@/components/permission/PermissionSearchSuggestInput";
import { FaIcon } from "@/components/FaIcon";
import {
  createPermission,
  deletePermission,
  fetchPermissionPage,
  updatePermission,
} from "@/lib/api/permissions";
import { fetchRolePage } from "@/lib/api/roles";
import { adminSidebarPermissionCodes } from "@/lib/adminSidebarNav";
import type { ApiErrorBody, Permission, PermissionPayload } from "@/lib/types/permission";
import type { Role } from "@/lib/types/role";
import { userSidebarPermissionCodes } from "@/lib/userSidebarNav";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

const ADMIN_SIDEBAR_PERM_ROWS = adminSidebarPermissionCodes();
const USER_SIDEBAR_PERM_ROWS = userSidebarPermissionCodes();

const emptyForm: PermissionPayload = {
  permissionCode: "",
  permissionName: "",
  description: "",
  visibleInAdminPortal: true,
  visibleInUserPortal: false,
  roleIds: [],
};

export default function AdminPermissionsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);

  const [data, setData] = useState<Awaited<
    ReturnType<typeof fetchPermissionPage>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PermissionPayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô tìm với query khi đổi URL
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchPermissionPage(page, 10, "id,desc", qParam || undefined);
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

  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    setRolesLoading(true);
    void (async () => {
      try {
        const page = await fetchRolePage(0, 500, "roleName,asc");
        if (!cancelled) setRoleOptions(page.content);
      } catch {
        if (!cancelled) setRoleOptions([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

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

  function openEdit(row: Permission) {
    setEditingId(row.id);
    setForm({
      permissionCode: row.permissionCode,
      permissionName: row.permissionName,
      description: row.description ?? "",
      visibleInAdminPortal: row.visibleInAdminPortal ?? true,
      visibleInUserPortal: row.visibleInUserPortal ?? false,
      roleIds: (row.linkedRoles ?? []).map((r) => r.id),
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
    if (!form.visibleInAdminPortal && !form.visibleInUserPortal) {
      setFormError("Cần bật ít nhất một cổng hiển thị (quản trị hoặc thành viên).");
      setSaving(false);
      return;
    }
    const payload: PermissionPayload = {
      permissionCode: form.permissionCode.trim(),
      permissionName: form.permissionName.trim(),
      description: form.description?.trim() || undefined,
      visibleInAdminPortal: form.visibleInAdminPortal,
      visibleInUserPortal: form.visibleInUserPortal,
      roleIds: form.roleIds,
    };
    try {
      if (editingId == null) {
        await createPermission(payload);
      } else {
        await updatePermission(editingId, payload);
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
    if (!confirm("Xóa quyền này?")) return;
    try {
      await deletePermission(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function toggleRoleId(roleId: number, checked: boolean) {
    setForm((f) => {
      const next = new Set(f.roleIds);
      if (checked) {
        next.add(roleId);
      } else {
        next.delete(roleId);
      }
      return { ...f, roleIds: [...next].sort((a, b) => a - b) };
    });
  }

  return (
    <>
      <ContentHeader
        title="Quản lý quyền"
        titleIcon="fa-solid fa-key"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quyền truy cập" },
        ]}
      />

      <div className="mb-4 flex flex-col flex-wrap items-stretch gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 shadow-sm sm:flex-row sm:items-center sm:gap-3">
        <span className="shrink-0 font-semibold text-sky-950">Chọn mục sidebar theo vai trò:</span>
        <Link
          href="/admin/sidebar-config"
          className="lte-btn lte-btn-primary lte-btn-sm inline-flex shrink-0 items-center justify-center gap-2 shadow-sm"
        >
          <FaIcon icon="fa-solid fa-list" />
          Cấu hình menu sidebar
        </Link>
        <span className="text-[#475569] sm:inline">
          — hoặc gắn <em className="text-sky-900">Mục sidebar</em> trong{" "}
          <a href="#permissions-list" className="font-semibold text-sky-700 underline hover:text-sky-900">
            Định nghĩa quyền
          </a>{" "}
          rồi{" "}
          <span className="font-semibold text-sky-800">gán quyền</span>.
        </span>
      </div>

      <details className="mb-4 rounded-xl border border-[#dfe7ee] bg-gradient-to-r from-[#f6f9fc] to-white px-4 py-3 text-sm shadow-sm">
        <summary className="cursor-pointer list-none font-semibold text-[#2c3e50] outline-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <FaIcon icon="fa-solid fa-sidebar" className="text-[#3c8dbc]" />
            Cài đặt sidebar theo vai trò (Permission)
          </span>
        </summary>
        <p className="mt-3 text-xs leading-relaxed text-[#6c757d]">
          Sidebar lọc theo dữ liệu đăng nhập <span className="font-mono text-[#495057]">/auth/me</span> →{" "}
          <span className="font-mono">displayPermissions</span>. Tạo Permission với{" "}
          <strong>mã quyền</strong> trùng một dòng dưới đây, bật đúng cổng (Quản trị / Thành viên), rồi gán{" "}
          <strong>vai trò</strong> — tài khoản có vai trò đó sẽ thấy đúng mục menu. Vai trò{" "}
          <strong>ADMIN</strong> luôn thấy đủ menu.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#3c8dbc]">
              Cổng quản trị (/admin)
            </p>
            <div className="max-h-40 overflow-auto rounded-lg border border-[#eef2f6] bg-white text-xs">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#f1f5f9] text-[#495057]">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold">Mã quyền</th>
                    <th className="px-2 py-1.5 font-semibold">Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_SIDEBAR_PERM_ROWS.map((row) => (
                    <tr key={row.code} className="border-t border-[#f0f3f6]">
                      <td className="px-2 py-1.5 font-mono text-[#256994]">{row.code}</td>
                      <td className="px-2 py-1.5 text-[#495057]">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[11px] text-[#868e96]">
              Mục &quot;Bảng điều khiển&quot; (/admin) không gắn mã — luôn hiện khi không có quyền nào khớp cổng.
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-600">
              Cổng thành viên (/user)
            </p>
            <div className="max-h-40 overflow-auto rounded-lg border border-[#eef2f6] bg-white text-xs">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#f1f5f9] text-[#495057]">
                  <tr>
                    <th className="px-2 py-1.5 font-semibold">Mã quyền</th>
                    <th className="px-2 py-1.5 font-semibold">Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {USER_SIDEBAR_PERM_ROWS.map((row) => (
                    <tr key={row.code} className="border-t border-[#f0f3f6]">
                      <td className="px-2 py-1.5 font-mono text-indigo-800">{row.code}</td>
                      <td className="px-2 py-1.5 text-[#495057]">{row.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[11px] text-[#868e96]">
              &quot;Trang chủ&quot; (/user) không gắn mã — luôn hiện làm điểm neo.
            </p>
          </div>
        </div>
      </details>

      <LteCard
        id="permissions-list"
        title="Danh sách quyền"
        titleIcon="fa-solid fa-shield-halved"
        tools={
          <button
            type="button"
            onClick={openCreate}
            className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
          >
            <FaIcon icon="fa-solid fa-plus" />
            Thêm quyền
          </button>
        }
      >
        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <PermissionSearchSuggestInput
            name="q"
            value={draft}
            onChange={setDraft}
            onPickSuggestion={(s) => {
              const term = `${s.permissionCode} ${s.permissionName}`.trim();
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
                        <FaIcon icon="fa-solid fa-code" className="text-[#3c8dbc]" />
                        Mã quyền
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
                        <FaIcon icon="fa-solid fa-window-restore" className="text-[#3c8dbc]" />
                        Cổng hiển thị
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-user-shield" className="text-[#3c8dbc]" />
                        Vai trò
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
                      <td colSpan={6} className="px-4 py-14 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-[#6c757d]">
                          <FaIcon icon="fa-solid fa-filter-circle-xmark" className="text-4xl text-[#dee2e6]" />
                          <p className="text-sm font-medium text-[#495057]">
                            Không có quyền phù hợp
                          </p>
                          <p className="text-xs">
                            Thử từ khóa khác hoặc thêm quyền mới (ví dụ{" "}
                            <span className="font-mono text-[#3c8dbc]">users:read</span>).
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.content.map((r) => (
                    <tr key={r.id} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">
                        {r.permissionCode}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#2c3e50]">{r.permissionName}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.visibleInAdminPortal && (
                            <span className="rounded-full bg-[#3c8dbc]/15 px-2 py-0.5 text-xs font-semibold text-[#256994]">
                              Quản trị
                            </span>
                          )}
                          {r.visibleInUserPortal && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
                              Thành viên
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[10rem] px-4 py-3 text-xs text-[#6c757d]">
                        {(r.linkedRoles ?? []).length === 0 ? (
                          <span className="italic text-[#adb5bd]">Chưa gán</span>
                        ) : (
                          <span className="line-clamp-2" title={(r.linkedRoles ?? []).map((x) => x.roleCode).join(", ")}>
                            {(r.linkedRoles ?? []).map((x) => x.roleCode).join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-[#6c757d]">
                        {r.description || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f6] pt-4 text-sm text-[#6c757d]">
              <span className="inline-flex flex-wrap items-center gap-2">
                <FaIcon icon="fa-solid fa-list-ol" className="text-[#adb5bd]" />
                {data.totalElements === 0 ? (
                  "Chưa có bản ghi"
                ) : (
                  <>
                    Hiển thị{" "}
                    <strong className="text-[#495057]">
                      {data.number * data.size + 1}–
                      {data.number * data.size + data.content.length}
                    </strong>{" "}
                    / <strong className="text-[#495057]">{data.totalElements}</strong> quyền
                    {qParam && (
                      <span className="rounded-full bg-[#3c8dbc]/10 px-2 py-0.5 text-xs text-[#3c8dbc]">
                        Lọc: &quot;{qParam}&quot;
                      </span>
                    )}
                  </>
                )}
              </span>
              {data.totalPages > 1 && (
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
                  <span className="self-center text-xs text-[#adb5bd]">
                    Trang {data.number + 1}/{data.totalPages}
                  </span>
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
              )}
            </div>
          </>
        )}
      </LteCard>

      {modalOpen && (
        <div className="lte-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
          <div
            className="lte-modal-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-modal-title"
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
                <h4 id="permission-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                  {editingId == null ? "Thêm quyền" : "Sửa quyền"}
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
                label="Mã quyền"
                labelIcon="fa-solid fa-code"
                error={fieldErrors.permissionCode}
                hint="Trùng mã với menu (ví dụ admin:users). Hệ thống chuẩn hóa mã về chữ thường. Bật cổng Quản trị + gán vai trò; sau đăng nhập sidebar hiện đúng mục (dữ liệu lấy từ /auth/me)."
                input={
                  <input
                    required
                    className="lte-input w-full font-mono text-sm"
                    value={form.permissionCode}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, permissionCode: e.target.value }))
                    }
                  />
                }
              />
              <Field
                label="Tên hiển thị"
                labelIcon="fa-solid fa-signature"
                error={fieldErrors.permissionName}
                hint="Có thể dùng tiếng Việt có dấu."
                input={
                  <input
                    required
                    className="lte-input w-full"
                    value={form.permissionName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, permissionName: e.target.value }))
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

              <div className="rounded-xl border border-[#e8ecf0] bg-gradient-to-br from-[#fafcfd] to-white p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                  <FaIcon icon="fa-solid fa-window-maximize" className="text-[#3c8dbc]" />
                  Hiển thị theo cổng
                </p>
                <div className="space-y-2.5">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-1 hover:bg-white/80">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-[#ced4da] text-[#3c8dbc] focus:ring-[#3c8dbc]"
                      checked={form.visibleInAdminPortal}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, visibleInAdminPortal: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#2c3e50]">Cổng quản trị</span>
                      <span className="text-xs text-[#6c757d]">
                        Menu bên trái khu vực /admin khi tài khoản được gán quyền này qua vai trò.
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-1 py-1 hover:bg-white/80">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 shrink-0 rounded border-[#ced4da] text-indigo-600 focus:ring-indigo-500"
                      checked={form.visibleInUserPortal}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, visibleInUserPortal: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#2c3e50]">Cổng thành viên</span>
                      <span className="text-xs text-[#6c757d]">
                        Thanh điều hướng /user cho người dùng có vai trò được chọn.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-[#e8ecf0] p-4">
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                  <FaIcon icon="fa-solid fa-users-gear" className="text-[#3c8dbc]" />
                  Vai trò được áp dụng
                </p>
                <p className="mb-3 text-xs text-[#6c757d]">
                  Chỉ tài khoản có ít nhất một vai trò được chọn mới nhận quyền này trong API /me (ảnh hưởng menu).
                </p>
                {rolesLoading && (
                  <p className="flex items-center gap-2 py-4 text-sm text-[#6c757d]">
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
                    Đang tải danh sách vai trò…
                  </p>
                )}
                {!rolesLoading && roleOptions.length === 0 && (
                  <p className="text-sm text-amber-800">Không tải được vai trò. Thử đóng và mở lại hộp thoại.</p>
                )}
                {!rolesLoading && roleOptions.length > 0 && (
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-[#eef2f6] bg-white p-3">
                    {roleOptions.map((role) => (
                      <label
                        key={role.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-[#f8fafc]"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-[#ced4da] text-[#3c8dbc] focus:ring-[#3c8dbc]"
                          checked={form.roleIds.includes(role.id)}
                          onChange={(e) => toggleRoleId(role.id, e.target.checked)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-xs text-[#3c8dbc]">{role.roleCode}</span>
                          <span className="text-sm font-medium text-[#2c3e50]">{role.roleName}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

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
      {hint && !error && <p className="mb-1.5 text-xs text-[#6c757d]">{hint}</p>}
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
