"use client";

import { FaIcon } from "@/components/FaIcon";
import {
  createDutyAssignment,
  deleteDutyAssignment,
  fetchDutyAssignmentPage,
  updateDutyAssignment,
} from "@/lib/api/dutyAssignments";
import { fetchDepartmentPage } from "@/lib/api/departments";
import { fetchFacultyPage } from "@/lib/api/faculties";
import { fetchPositionPage } from "@/lib/api/positions";
import { fetchUserPage } from "@/lib/api/users";
import type { ApiErrorBody, SpringPage } from "@/lib/types/common";
import type { DutyAssignment } from "@/lib/types/dutyAssignment";
import type { User } from "@/lib/types/user";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ContentHeader } from "./ContentHeader";
import { LteCard } from "./Card";

type OrgForm = {
  userId: string;
  facultyId: number | null;
  departmentId: number | null;
  positionId: number | null;
};

const emptyOrgForm = (): OrgForm => ({
  userId: "",
  facultyId: null,
  departmentId: null,
  positionId: null,
});

function OrgCell({
  name,
  icon,
}: {
  name: string | null | undefined;
  icon: string;
}) {
  const t = name?.trim();
  if (!t) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#adb5bd]">
        <FaIcon icon="fa-solid fa-minus" className="opacity-70" />
        Chưa gán
      </span>
    );
  }
  return (
    <span className="inline-flex max-w-[220px] items-center gap-2 truncate rounded-lg border border-[#e3e8ec] bg-gradient-to-r from-[#f8fafc] to-white px-2.5 py-1.5 text-xs font-medium text-[#495057] shadow-sm">
      <FaIcon icon={icon} className="shrink-0 text-[#3c8dbc]" />
      <span className="truncate">{t}</span>
    </span>
  );
}

export default function AdminDutyAssignmentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(0, Number(searchParams.get("page") || 0) || 0);
  const qParam = (searchParams.get("q") || "").trim();

  const [draft, setDraft] = useState(qParam);
  const [data, setData] = useState<SpringPage<DutyAssignment> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUserLabel, setEditingUserLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<OrgForm>(emptyOrgForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [userOptions, setUserOptions] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [facultyOptions, setFacultyOptions] = useState<{ id: number; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; label: string }[]>([]);
  const [positionOptions, setPositionOptions] = useState<{ id: number; label: string }[]>([]);
  const [orgOptionsLoading, setOrgOptionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setOrgOptionsLoading(true);
      try {
        const [fp, dp, pp] = await Promise.all([
          fetchFacultyPage(0, 500, "facultyName"),
          fetchDepartmentPage(0, 500, "departmentName"),
          fetchPositionPage(0, 500, "positionName", undefined, undefined),
        ]);
        if (!cancelled) {
          setFacultyOptions(
            fp.content.map((x) => ({ id: x.id, label: `${x.facultyCode} — ${x.facultyName}` }))
          );
          setDepartmentOptions(
            dp.content.map((x) => ({ id: x.id, label: `${x.departmentCode} — ${x.departmentName}` }))
          );
          setPositionOptions(
            pp.content.map((x) => ({ id: x.id, label: `${x.positionCode} — ${x.positionName}` }))
          );
        }
      } catch {
        if (!cancelled) {
          setFacultyOptions([]);
          setDepartmentOptions([]);
          setPositionOptions([]);
        }
      } finally {
        if (!cancelled) setOrgOptionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadUsersForModal = useCallback(async () => {
    setUsersLoading(true);
    try {
      const p = await fetchUserPage(0, 400, "fullName,asc");
      setUserOptions(p.content);
    } catch {
      setUserOptions([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    setDraft(qParam);
  }, [qParam]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await fetchDutyAssignmentPage(page, 10, "id,desc", qParam || undefined);
      setData(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi không xác định");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, qParam]);

  useEffect(() => {
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
    setModalMode("create");
    setEditingUserLabel("");
    setEditingId(null);
    setForm(emptyOrgForm());
    setFormError(null);
    setFieldErrors({});
    void loadUsersForModal();
    setModalOpen(true);
  }

  function openEdit(row: DutyAssignment) {
    setModalMode("edit");
    setEditingUserLabel(`${row.fullName} · @${row.username}`);
    setEditingId(row.id);
    setForm({
      userId: row.userId,
      facultyId: row.facultyId,
      departmentId: row.departmentId,
      positionId: row.positionId,
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
    if (modalMode === "create" && !form.userId.trim()) {
      setFormError("Chọn người dùng cần phân công.");
      return;
    }
    setSaving(true);
    try {
      const org = {
        facultyId: form.facultyId,
        departmentId: form.departmentId,
        positionId: form.positionId,
      };
      if (modalMode === "create") {
        await createDutyAssignment({ userId: form.userId.trim(), ...org });
      } else if (editingId != null) {
        await updateDutyAssignment(editingId, org);
      }
      closeModal();
      await load();
    } catch (err) {
      const er = err as Error & { apiError?: ApiErrorBody };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setFormError(er.message || "Có lỗi xảy ra");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: DutyAssignment) {
    if (!confirm(`Xóa phân công nhiệm vụ của ${row.fullName}?`)) return;
    try {
      await deleteDutyAssignment(row.id);
      await load();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const hasActiveFilters = Boolean(qParam);

  return (
    <>
      <ContentHeader
        title="Phân công nhiệm vụ"
        titleIcon="fa-solid fa-id-badge"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Phân công nhiệm vụ" },
        ]}
      />

      <LteCard
        title="Danh sách phân công"
        titleIcon="fa-solid fa-list-check"
        tools={
          <button
            type="button"
            onClick={openCreate}
            className="lte-btn lte-btn-primary lte-btn-sm shadow-sm"
          >
            <FaIcon icon="fa-solid fa-user-plus" />
            Gán nhiệm vụ mới
          </button>
        }
      >
        <div className="mb-5 flex gap-3 rounded-xl border border-[#e3f2fd] bg-gradient-to-r from-[#f8fcff] to-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3c8dbc]/12 text-[#2f7494]">
            <FaIcon icon="fa-solid fa-circle-info" className="text-lg" />
          </span>
          <p className="text-sm leading-relaxed text-[#5a6c7d]">
            <span className="font-semibold text-[#495057]">Một người — một phân công.</span> Khoa, phòng ban và chức
            vụ được lưu ở module này, tách khỏi tài khoản để dễ quản lý và tra cứu.
          </p>
        </div>

        <form
          onSubmit={applySearch}
          className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="relative min-w-0 flex-1">
            <FaIcon
              icon="fa-solid fa-magnifying-glass"
              className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-sm text-[#adb5bd]"
              aria-hidden
            />
            <input
              name="q"
              className="lte-input w-full pl-9 text-sm"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Tìm theo username, họ tên, email, khoa, phòng ban, chức vụ…"
              aria-label="Từ khóa tìm kiếm"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="submit" className="lte-btn lte-btn-primary lte-btn-sm">
              <FaIcon icon="fa-solid fa-magnifying-glass" />
              Tìm kiếm
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearSearch} className="lte-btn lte-btn-ghost lte-btn-sm">
                <FaIcon icon="fa-solid fa-filter-circle-xmark" />
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
                        Người dùng
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
                        <FaIcon icon="fa-solid fa-building-columns" className="text-[#3c8dbc]" />
                        Khoa
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-sitemap" className="text-[#3c8dbc]" />
                        Phòng ban
                      </span>
                    </th>
                    <th className="border-b border-[#e3e8ec] px-4 py-3 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <FaIcon icon="fa-solid fa-briefcase" className="text-[#3c8dbc]" />
                        Chức vụ
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
                          <FaIcon
                            icon="fa-solid fa-clipboard-list"
                            className="text-4xl text-[#dee2e6]"
                            aria-hidden
                          />
                          <p className="text-sm font-medium text-[#495057]">Chưa có phân công nào</p>
                          <p className="text-xs leading-relaxed">
                            {hasActiveFilters
                              ? "Thử từ khóa khác hoặc xóa bộ lọc."
                              : "Bấm “Gán nhiệm vụ mới” để gán khoa / phòng ban / chức vụ cho người dùng."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.content.map((row) => (
                    <tr key={row.id} className="border-b border-[#f0f3f6] last:border-0 transition-colors hover:bg-[#fafcfd]/80">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3c8dbc]/10 text-[#3c8dbc]">
                            <FaIcon icon="fa-solid fa-user" className="text-sm" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium text-[#2c3e50]">{row.fullName}</div>
                            <div className="font-mono text-xs text-[#6c757d]">{row.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-[#495057]">
                        <span className="inline-flex items-center gap-1.5">
                          <FaIcon icon="fa-solid fa-at" className="shrink-0 text-[#adb5bd] text-xs" />
                          <span className="truncate">{row.email}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <OrgCell name={row.facultyName} icon="fa-solid fa-building-columns" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <OrgCell name={row.departmentName} icon="fa-solid fa-sitemap" />
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <OrgCell name={row.positionName} icon="fa-solid fa-briefcase" />
                      </td>
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
                          onClick={() => void handleDelete(row)}
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
                <span className="inline-flex flex-wrap items-center gap-2">
                  <FaIcon icon="fa-solid fa-file-lines" className="text-[#adb5bd]" />
                  Trang {data.number + 1}/{data.totalPages} — {data.totalElements} bản ghi
                  {qParam && (
                    <span className="rounded-full bg-[#3c8dbc]/10 px-2 py-0.5 text-xs font-medium text-[#3c8dbc]">
                      <FaIcon icon="fa-solid fa-filter" className="mr-1 opacity-80" />
                      &quot;{qParam}&quot;
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
            className="lte-modal-panel max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#e8ecf0] bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="duty-modal-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3c8dbc]/12 text-[#3c8dbc]">
                  <FaIcon
                    icon={modalMode === "create" ? "fa-solid fa-user-plus" : "fa-solid fa-pen-to-square"}
                    className="text-lg"
                  />
                </span>
                <h4 id="duty-modal-title" className="text-lg font-semibold text-[#2c3e50]">
                  {modalMode === "create" ? "Gán nhiệm vụ mới" : "Sửa phân công nhiệm vụ"}
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

              {modalMode === "create" ? (
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                    <FaIcon icon="fa-solid fa-user" className="text-[#3c8dbc]" />
                    Chọn người dùng <span className="text-red-600">*</span>
                  </label>
                  {usersLoading ? (
                    <p className="flex items-center gap-2 text-xs text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
                      Đang tải danh sách…
                    </p>
                  ) : (
                    <select
                      required
                      className="lte-input w-full"
                      value={form.userId}
                      onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                    >
                      <option value="">— Chọn người dùng —</option>
                      {userOptions.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.username})
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.userId && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                      <FaIcon icon="fa-solid fa-circle-xmark" />
                      {fieldErrors.userId}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-3 rounded-xl border border-[#e8ecf0] bg-gradient-to-r from-[#fafcfd] to-white p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3c8dbc]/10 text-[#3c8dbc]">
                    <FaIcon icon="fa-solid fa-user-check" />
                  </span>
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold text-[#495057]">Người được phân công</div>
                    <div className="mt-0.5 text-[#2c3e50]">{editingUserLabel || form.userId}</div>
                    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-[#6c757d]">
                      <FaIcon icon="fa-solid fa-lightbulb" className="mt-0.5 shrink-0 text-amber-600/90" />
                      Để đổi người: xóa phân công này rồi tạo phân công mới cho tài khoản khác.
                    </p>
                  </div>
                </div>
              )}

              {orgOptionsLoading ? (
                <p className="flex items-center gap-2 rounded-lg border border-[#e3e8ec] bg-[#fafcfd] px-3 py-2.5 text-xs text-[#6c757d]">
                  <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
                  Đang tải danh mục khoa / phòng ban / chức vụ…
                </p>
              ) : (
                <div className="rounded-xl border border-[#e3e8ec] bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#495057]">
                    <FaIcon icon="fa-solid fa-diagram-project" className="text-[#3c8dbc]" />
                    Đơn vị & chức vụ
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-building-columns" className="text-[#3c8dbc]" />
                        Khoa
                      </label>
                      <select
                        className="lte-input w-full text-sm"
                        value={form.facultyId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => ({ ...f, facultyId: v === "" ? null : Number(v) }));
                        }}
                      >
                        <option value="">— Chưa gán —</option>
                        {facultyOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.facultyId && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                          <FaIcon icon="fa-solid fa-circle-xmark" />
                          {fieldErrors.facultyId}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-sitemap" className="text-[#3c8dbc]" />
                        Phòng ban
                      </label>
                      <select
                        className="lte-input w-full text-sm"
                        value={form.departmentId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => ({ ...f, departmentId: v === "" ? null : Number(v) }));
                        }}
                      >
                        <option value="">— Chưa gán —</option>
                        {departmentOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.departmentId && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                          <FaIcon icon="fa-solid fa-circle-xmark" />
                          {fieldErrors.departmentId}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-[#495057]">
                        <FaIcon icon="fa-solid fa-briefcase" className="text-[#3c8dbc]" />
                        Chức vụ
                      </label>
                      <select
                        className="lte-input w-full text-sm"
                        value={form.positionId ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          setForm((f) => ({ ...f, positionId: v === "" ? null : Number(v) }));
                        }}
                      >
                        <option value="">— Chưa gán —</option>
                        {positionOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.positionId && (
                        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
                          <FaIcon icon="fa-solid fa-circle-xmark" />
                          {fieldErrors.positionId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-4">
                <button type="button" onClick={closeModal} className="lte-btn lte-btn-ghost lte-btn-sm">
                  <FaIcon icon="fa-solid fa-ban" />
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="lte-btn lte-btn-primary lte-btn-sm">
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
