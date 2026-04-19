"use client";

import { VietnamAddressPicker } from "@/components/address/VietnamAddressPicker";
import { FaIcon } from "@/components/FaIcon";
import { fetchRolePage } from "@/lib/api/roles";
import { uploadUserAvatar } from "@/lib/api/uploads";
import {
  createUser,
  deleteUser,
  fetchUserPage,
  updateUser,
} from "@/lib/api/users";
import { resolvePublicUrl } from "@/lib/mediaUrl";
import type { ApiErrorBody, User, UserStatus } from "@/lib/types/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type UserForm = {
  username: string;
  email: string;
  password: string;
  phoneNumber: string;
  status: UserStatus;
  fullName: string;
  dob: string;
  gender: string;
  cccd: string;
  passport: string;
  address: string;
  currentAddress: string;
  personalEmail: string;
  avatarUrl: string;
  nationality: string;
  ethnicity: string;
  maritalStatus: string;
  roleIds: number[];
};

const emptyForm: UserForm = {
  username: "",
  email: "",
  password: "",
  phoneNumber: "",
  status: "Active",
  fullName: "",
  dob: "",
  gender: "",
  cccd: "",
  passport: "",
  address: "",
  currentAddress: "",
  personalEmail: "",
  avatarUrl: "",
  nationality: "",
  ethnicity: "",
  maritalStatus: "",
  roleIds: [],
};

function opt(s: string): string | null {
  const t = s.trim();
  return t ? t : null;
}

export default function AdminUsersClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchUserPage>> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pickerNonce, setPickerNonce] = useState(0);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    { id: number; roleCode: string; roleName: string }[]
  >([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRolesLoading(true);
      try {
        const p = await fetchRolePage(0, 500, "roleCode,asc");
        if (!cancelled) {
          setRoleOptions(p.content);
        }
      } catch {
        if (!cancelled) {
          setRoleOptions([]);
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ ô tìm với query
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchUserPage(page, 10, "createdAt,desc", qParam || undefined);
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
    setPickerNonce((n) => n + 1);
    setForm(emptyForm);
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function openEdit(u: User) {
    setEditingId(u.id);
    setPickerNonce((n) => n + 1);
    setForm({
      username: u.username,
      email: u.email,
      password: "",
      phoneNumber: u.phoneNumber ?? "",
      status: u.status,
      fullName: u.fullName,
      dob: u.dob ? u.dob.slice(0, 10) : "",
      gender: u.gender ?? "",
      cccd: u.cccd ?? "",
      passport: u.passport ?? "",
      address: u.address ?? "",
      currentAddress: u.currentAddress ?? "",
      personalEmail: u.personalEmail ?? "",
      avatarUrl: u.avatarUrl ?? "",
      nationality: u.nationality ?? "",
      ethnicity: u.ethnicity ?? "",
      maritalStatus: u.maritalStatus ?? "",
      roleIds: (u.roles ?? []).map((r) => r.id),
    });
    setFormError(null);
    setFieldErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleAvatarFileChange(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setFormError(null);
    setAvatarUploading(true);
    try {
      const { url } = await uploadUserAvatar(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload ảnh thất bại";
      setFormError(msg);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (editingId == null && form.password.trim().length < 6) {
      setFormError("Mật khẩu tạo mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (editingId != null && form.password.trim() && form.password.trim().length < 6) {
      setFormError("Mật khẩu mới phải có ít nhất 6 ký tự (hoặc để trống).");
      return;
    }

    setSaving(true);
    try {
      if (editingId == null) {
        await createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
          status: form.status,
          fullName: form.fullName.trim(),
          phoneNumber: opt(form.phoneNumber),
          dob: opt(form.dob),
          gender: opt(form.gender),
          cccd: opt(form.cccd),
          passport: opt(form.passport),
          address: opt(form.address),
          currentAddress: opt(form.currentAddress),
          personalEmail: opt(form.personalEmail),
          avatarUrl: opt(form.avatarUrl),
          nationality: opt(form.nationality),
          ethnicity: opt(form.ethnicity),
          maritalStatus: opt(form.maritalStatus),
          roleIds: form.roleIds,
        });
      } else {
        const body = {
          username: form.username.trim(),
          email: form.email.trim(),
          status: form.status,
          fullName: form.fullName.trim(),
          phoneNumber: opt(form.phoneNumber),
          dob: opt(form.dob),
          gender: opt(form.gender),
          cccd: opt(form.cccd),
          passport: opt(form.passport),
          address: opt(form.address),
          currentAddress: opt(form.currentAddress),
          personalEmail: opt(form.personalEmail),
          avatarUrl: opt(form.avatarUrl),
          nationality: opt(form.nationality),
          ethnicity: opt(form.ethnicity),
          maritalStatus: opt(form.maritalStatus),
          roleIds: form.roleIds,
        };
        const pw = form.password.trim();
        await updateUser(editingId, pw ? { ...body, password: pw } : body);
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

  async function handleDelete(id: string) {
    if (!confirm("Xóa mềm người dùng này?")) return;
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function statusBadge(s: UserStatus) {
    if (s === "Active") return "bg-emerald-100 text-emerald-900";
    if (s === "Inactive") return "bg-slate-200 text-slate-800";
    return "bg-amber-100 text-amber-950";
  }

  return (
    <>
      <ContentHeader
        title="Quản lý người dùng"
        titleIcon="fa-solid fa-users"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Người dùng" },
        ]}
      />

      <LteCard
        title="Danh sách người dùng"
        titleIcon="fa-solid fa-address-book"
        tools={
          <button
            type="button"
            onClick={openCreate}
            className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
          >
            <FaIcon icon="fa-solid fa-user-plus" />
            Thêm người dùng
          </button>
        }
      >
        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            name="q"
            className="lte-input min-w-0 flex-1 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tìm theo username, email, họ tên, SĐT, CCCD…"
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
                        <FaIcon icon="fa-solid fa-user" className="text-[#3c8dbc]" />
                        Username
                      </span>
                    </th>
                    <th className="w-14 border-b border-[#e3e8ec] px-2 py-3 text-center font-semibold">
                      <span className="inline-flex items-center justify-center gap-1">
                        <FaIcon icon="fa-solid fa-image" className="text-[#3c8dbc]" />
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-envelope" className="text-[#3c8dbc]" />
                        Email
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-signature" className="text-[#3c8dbc]" />
                        Họ tên
                      </span>
                    </th>
                    <th className="min-w-[140px] border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-user-shield" className="text-[#3c8dbc]" />
                        Vai trò
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-signal" className="text-[#3c8dbc]" />
                        Trạng thái
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
                      <td colSpan={7} className="px-4 py-14 text-center">
                        <div className="mx-auto flex max-w-md flex-col items-center gap-2 text-[#6c757d]">
                          <FaIcon
                            icon="fa-solid fa-filter-circle-xmark"
                            className="text-4xl text-[#dee2e6]"
                          />
                          <p className="text-sm font-medium text-[#495057]">
                            Không có người dùng phù hợp
                          </p>
                          <p className="text-xs">Thử từ khóa khác hoặc thêm người dùng mới.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.content.map((u) => (
                    <tr key={u.id} className="border-b border-[#f0f3f6] last:border-0">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">
                        {u.username}
                      </td>
                      <td className="px-2 py-2 text-center align-middle">
                        {(() => {
                          const src = resolvePublicUrl(u.avatarUrl);
                          return src ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL động từ API, không dùng Image domain cố định
                            <img
                              src={src}
                              alt=""
                              className="mx-auto h-9 w-9 rounded-full border border-[#e3e8ec] object-cover"
                              width={36}
                              height={36}
                              loading="lazy"
                            />
                          ) : (
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#f1f3f5] text-[10px] text-[#adb5bd]">
                              —
                            </span>
                          );
                        })()}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-[#495057]">{u.email}</td>
                      <td className="px-4 py-3 font-medium text-[#2c3e50]">{u.fullName}</td>
                      <td className="max-w-[220px] px-4 py-3 align-top">
                        <div className="flex flex-wrap gap-1">
                          {(u.roles ?? []).length === 0 && (
                            <span className="text-xs text-[#adb5bd]">—</span>
                          )}
                          {(u.roles ?? []).map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex max-w-full items-center truncate rounded-md border border-[#cfe8f6] bg-[#f0f7fb] px-1.5 py-0.5 text-[11px] font-medium text-[#1a5270]"
                              title={`${r.roleName} (${r.roleCode})`}
                            >
                              {r.roleCode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(u.status)}`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="lte-btn lte-btn-ghost lte-btn-sm mr-1 border-transparent text-[#3c8dbc] hover:bg-[#3c8dbc]/10"
                        >
                          <FaIcon icon="fa-solid fa-pen-to-square" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(u.id)}
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
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} người dùng
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
            className="lte-modal-panel max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3c8dbc]/12 text-[#3c8dbc]">
                  <FaIcon
                    icon={
                      editingId == null ? "fa-solid fa-user-plus" : "fa-solid fa-pen-to-square"
                    }
                    className="text-lg"
                  />
                </span>
                <h4 id="user-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                  {editingId == null ? "Thêm người dùng" : "Sửa người dùng"}
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

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Username"
                  labelIcon="fa-solid fa-user"
                  error={fieldErrors.username}
                  input={
                    <input
                      required
                      autoComplete="username"
                      className="lte-input w-full"
                      value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Email đăng nhập"
                  labelIcon="fa-solid fa-envelope"
                  error={fieldErrors.email}
                  input={
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      className="lte-input w-full"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  }
                />
                <Field
                  label={editingId == null ? "Mật khẩu" : "Mật khẩu mới (để trống nếu giữ)"}
                  labelIcon="fa-solid fa-key"
                  error={fieldErrors.password}
                  hint={editingId == null ? "Tối thiểu 6 ký tự." : undefined}
                  input={
                    <input
                      type="password"
                      autoComplete={editingId == null ? "new-password" : "new-password"}
                      required={editingId == null}
                      className="lte-input w-full"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Trạng thái"
                  labelIcon="fa-solid fa-toggle-on"
                  error={fieldErrors.status}
                  input={
                    <select
                      required
                      className="lte-input w-full"
                      value={form.status}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, status: e.target.value as UserStatus }))
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Locked">Locked</option>
                    </select>
                  }
                />
                <Field
                  label="Họ và tên"
                  labelIcon="fa-solid fa-signature"
                  error={fieldErrors.fullName}
                  input={
                    <input
                      required
                      className="lte-input w-full"
                      value={form.fullName}
                      onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Số điện thoại"
                  labelIcon="fa-solid fa-phone"
                  error={fieldErrors.phoneNumber}
                  input={
                    <input
                      className="lte-input w-full"
                      value={form.phoneNumber}
                      onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Ngày sinh"
                  labelIcon="fa-solid fa-cake-candles"
                  error={fieldErrors.dob}
                  input={
                    <input
                      type="date"
                      className="lte-input w-full"
                      value={form.dob}
                      onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Giới tính"
                  labelIcon="fa-solid fa-venus-mars"
                  error={fieldErrors.gender}
                  input={
                    <select
                      className="lte-input w-full"
                      value={form.gender}
                      onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    >
                      <option value="">—</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  }
                />
                <Field
                  label="CCCD"
                  labelIcon="fa-solid fa-id-card"
                  error={fieldErrors.cccd}
                  input={
                    <input
                      className="lte-input w-full"
                      value={form.cccd}
                      onChange={(e) => setForm((f) => ({ ...f, cccd: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Hộ chiếu"
                  labelIcon="fa-solid fa-passport"
                  error={fieldErrors.passport}
                  input={
                    <input
                      className="lte-input w-full"
                      value={form.passport}
                      onChange={(e) => setForm((f) => ({ ...f, passport: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Email cá nhân"
                  labelIcon="fa-solid fa-at"
                  error={fieldErrors.personalEmail}
                  input={
                    <input
                      type="email"
                      className="lte-input w-full"
                      value={form.personalEmail}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, personalEmail: e.target.value }))
                      }
                    />
                  }
                />
                <Field
                  label="Quốc tịch"
                  labelIcon="fa-solid fa-earth-asia"
                  error={fieldErrors.nationality}
                  input={
                    <input
                      className="lte-input w-full"
                      value={form.nationality}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nationality: e.target.value }))
                      }
                    />
                  }
                />
                <Field
                  label="Dân tộc"
                  labelIcon="fa-solid fa-people-group"
                  error={fieldErrors.ethnicity}
                  input={
                    <input
                      className="lte-input w-full"
                      value={form.ethnicity}
                      onChange={(e) => setForm((f) => ({ ...f, ethnicity: e.target.value }))}
                    />
                  }
                />
                <Field
                  label="Tình trạng hôn nhân"
                  labelIcon="fa-solid fa-ring"
                  error={fieldErrors.maritalStatus}
                  input={
                    <select
                      className="lte-input w-full"
                      value={form.maritalStatus}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maritalStatus: e.target.value }))
                      }
                    >
                      <option value="">—</option>
                      <option value="Độc thân">Độc thân</option>
                      <option value="Đã kết hôn">Đã kết hôn</option>
                      <option value="Ly hôn">Ly hôn</option>
                      <option value="Góa">Góa</option>
                    </select>
                  }
                />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                    <FaIcon icon="fa-solid fa-image" className="text-[#3c8dbc] opacity-90" />
                    Ảnh đại diện
                  </label>
                  <p className="mb-2 text-xs text-[#6c757d]">
                    Chọn ảnh từ máy (jpg, png, gif, webp, tối đa 2MB). Có thể dán URL thủ công nếu cần.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e8ecf0] bg-white p-3">
                    {resolvePublicUrl(form.avatarUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolvePublicUrl(form.avatarUrl)!}
                        alt="Xem trước"
                        className="h-16 w-16 shrink-0 rounded-lg border border-[#e3e8ec] object-cover"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#dee2e6] bg-[#fafcfd] text-xs text-[#adb5bd]">
                        Chưa có
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                        disabled={avatarUploading || saving}
                        className="max-w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#3c8dbc] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#357ca5]"
                        onChange={(e) => {
                          void handleAvatarFileChange(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {avatarUploading && (
                        <p className="flex items-center gap-2 text-xs text-[#3c8dbc]">
                          <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                          Đang tải ảnh lên…
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <input
                          className="lte-input min-w-0 flex-1 text-xs"
                          placeholder="Hoặc URL ảnh (tối đa 255 ký tự)"
                          value={form.avatarUrl}
                          onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="lte-btn lte-btn-ghost lte-btn-sm shrink-0"
                          disabled={saving || !form.avatarUrl}
                          onClick={() => setForm((f) => ({ ...f, avatarUrl: "" }))}
                        >
                          <FaIcon icon="fa-solid fa-xmark" />
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                  {fieldErrors.avatarUrl && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <FaIcon icon="fa-solid fa-circle-xmark" />
                      {fieldErrors.avatarUrl}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-[#e8ecf0] bg-[#fafcfd] p-3">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                  <FaIcon icon="fa-solid fa-user-shield" className="text-[#3c8dbc]" />
                  Vai trò (bảng liên kết user_roles)
                </label>
                {rolesLoading ? (
                  <p className="flex items-center gap-2 text-xs text-[#6c757d]">
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                    Đang tải danh sách vai trò…
                  </p>
                ) : roleOptions.length === 0 ? (
                  <p className="text-xs text-amber-800">
                    Chưa có vai trò nào trong hệ thống. Tạo vai trò tại mục Quản lý vai trò trước.
                  </p>
                ) : (
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-[#e3e8ec] bg-white p-2">
                    {roleOptions.map((r) => (
                      <label
                        key={r.id}
                        className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#f1f5f9]"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-3.5 w-3.5 shrink-0 accent-[#3c8dbc]"
                          checked={form.roleIds.includes(r.id)}
                          onChange={() => {
                            setForm((f) => {
                              const on = f.roleIds.includes(r.id);
                              const roleIds = on
                                ? f.roleIds.filter((id) => id !== r.id)
                                : [...f.roleIds, r.id];
                              return { ...f, roleIds };
                            });
                          }}
                        />
                        <span className="min-w-0">
                          <span className="font-mono text-xs font-semibold text-[#495057]">
                            {r.roleCode}
                          </span>
                          <span className="block text-xs text-[#6c757d]">{r.roleName}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {fieldErrors.roleIds && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
                    <FaIcon icon="fa-solid fa-circle-xmark" />
                    {fieldErrors.roleIds}
                  </p>
                )}
              </div>

              <VietnamAddressPicker
                key={`addr-${pickerNonce}`}
                label="Địa chỉ thường trú (chọn từ API địa giới)"
                value={form.address}
                onChange={(address) => setForm((f) => ({ ...f, address }))}
              />
              <VietnamAddressPicker
                key={`curr-${pickerNonce}`}
                label="Địa chỉ hiện tại (chọn từ API địa giới)"
                value={form.currentAddress}
                onChange={(currentAddress) => setForm((f) => ({ ...f, currentAddress }))}
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
