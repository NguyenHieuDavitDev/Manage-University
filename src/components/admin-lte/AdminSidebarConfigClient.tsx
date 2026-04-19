"use client";

import { ContentHeader } from "@/components/admin-lte/ContentHeader";
import { LteCard } from "@/components/admin-lte/Card";
import { FaIcon } from "@/components/FaIcon";
import { fetchRolePage } from "@/lib/api/roles";
import {
  fetchRoleSidebarMenuState,
  updateRoleSidebarMenu,
} from "@/lib/api/roleSidebarMenu";
import type { Role } from "@/lib/types/role";
import type { RoleSidebarMenuState } from "@/lib/types/roleSidebarMenu";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdminSidebarConfigClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [roleId, setRoleId] = useState<number | "">("");

  const [state, setState] = useState<RoleSidebarMenuState | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stateLoading, setStateLoading] = useState(false);
  const [stateError, setStateError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setRolesLoading(true);
      try {
        const p = await fetchRolePage(0, 500, "roleName,asc");
        if (!cancelled) {
          setRoles(p.content);
          if (p.content.length > 0) {
            setRoleId((prev) => (prev === "" ? p.content[0].id : prev));
          }
        }
      } catch {
        if (!cancelled) setRoles([]);
      } finally {
        if (!cancelled) setRolesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ nạp danh sách vai trò một lần khi mount
  }, []);

  const loadState = useCallback(async (id: number) => {
    setStateLoading(true);
    setStateError(null);
    setSaveMsg(null);
    try {
      const s = await fetchRoleSidebarMenuState(id);
      setState(s);
      setSelected(new Set(s.selectedPermissionCodes));
    } catch (e) {
      setState(null);
      setSelected(new Set());
      setStateError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setStateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (roleId === "") return;
    void loadState(roleId);
  }, [roleId, loadState]);

  function toggleCode(code: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(code);
      } else {
        next.delete(code);
      }
      return next;
    });
    setSaveMsg(null);
  }

  async function handleSave() {
    if (roleId === "") return;
    setSaving(true);
    setSaveMsg(null);
    setStateError(null);
    try {
      const s = await updateRoleSidebarMenu(roleId, {
        permissionCodes: [...selected],
      });
      setState(s);
      setSelected(new Set(s.selectedPermissionCodes));
      setSaveMsg("Đã lưu cấu hình menu sidebar.");
    } catch (e) {
      setStateError((e as Error).message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ContentHeader
        title="Cấu hình menu sidebar"
        titleIcon="fa-solid fa-list-check"
        breadcrumbs={[
          { label: "Trang chủ", href: "/admin" },
          { label: "Quản lý quyền", href: "/admin/permissions" },
          { label: "Menu sidebar" },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/admin/permissions"
          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#dee2e6] bg-white"
        >
          <FaIcon icon="fa-solid fa-arrow-left" />
          Quay lại phân quyền
        </Link>
      </div>

      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50/95 px-4 py-3 text-sm text-sky-950 shadow-sm">
        <p className="leading-relaxed">
          <FaIcon icon="fa-solid fa-circle-info" className="mr-2 text-sky-600" />
          Chọn <strong>vai trò</strong>, đánh dấu các mục cần hiện trên sidebar cho người dùng thuộc vai trò đó.
          Mục <strong>Bảng điều khiển</strong> (/admin) không nằm trong danh sách — luôn hiển thị làm điểm neo. Tài khoản có
          vai trò <strong>ADMIN</strong> luôn thấy đủ menu, không phụ thuộc cấu hình này.
        </p>
      </div>

      <LteCard title="Thiết lập theo vai trò" titleIcon="fa-solid fa-user-gear">
        <div className="mb-6 max-w-md">
          <label className="mb-2 block text-sm font-semibold text-[#495057]">Vai trò</label>
          {rolesLoading ? (
            <p className="flex items-center gap-2 text-sm text-[#6c757d]">
              <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-[#3c8dbc]" />
              Đang tải vai trò…
            </p>
          ) : (
            <select
              className="lte-input w-full"
              value={roleId === "" ? "" : String(roleId)}
              onChange={(e) => {
                const v = e.target.value;
                setRoleId(v === "" ? "" : Number(v));
              }}
            >
              {roles.length === 0 && <option value="">— Không có vai trò —</option>}
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.roleCode} — {r.roleName}
                </option>
              ))}
            </select>
          )}
        </div>

        {stateError && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <FaIcon icon="fa-solid fa-circle-exclamation" className="mt-0.5 shrink-0" />
            {stateError}
          </p>
        )}
        {saveMsg && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <FaIcon icon="fa-solid fa-circle-check" className="mt-0.5 shrink-0" />
            {saveMsg}
          </p>
        )}

        {stateLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-[#6c757d]">
            <FaIcon icon="fa-solid fa-spinner" className="animate-spin text-3xl text-[#3c8dbc]" />
            <p className="text-sm font-medium">Đang tải cấu hình…</p>
          </div>
        )}

        {!stateLoading && state && (
          <div className="space-y-8">
            {state.groups.map((group) => (
              <section key={group.groupId}>
                <h3 className="mb-3 border-b border-[#e9ecef] pb-2 text-sm font-bold uppercase tracking-wide text-[#3c8dbc]">
                  {group.groupLabel}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <label
                      key={item.permissionCode}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#eef2f6] bg-[#fafcfd] p-3 transition hover:border-[#3c8dbc]/40 hover:bg-white"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 rounded border-[#ced4da] text-[#3c8dbc] focus:ring-[#3c8dbc]"
                        checked={selected.has(item.permissionCode)}
                        onChange={(e) => toggleCode(item.permissionCode, e.target.checked)}
                      />
                      <span className="min-w-0">
                        <span className="block font-medium text-[#2c3e50]">{item.label}</span>
                        <span className="mt-0.5 block font-mono text-xs text-[#6c757d]">
                          {item.permissionCode}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef2f6] pt-5">
              <button
                type="button"
                disabled={saving || roleId === ""}
                onClick={() => void handleSave()}
                className="lte-btn lte-btn-primary lte-btn-sm min-w-[8rem] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                    Đang lưu…
                  </>
                ) : (
                  <>
                    <FaIcon icon="fa-solid fa-floppy-disk" />
                    Lưu cấu hình
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </LteCard>
    </>
  );
}
