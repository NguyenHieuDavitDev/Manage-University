import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type {
  RoleSidebarMenuState,
  RoleSidebarMenuUpdatePayload,
} from "@/lib/types/roleSidebarMenu";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function base(roleId: number): string {
  return `${getApiBaseUrl()}/api/v1/roles/${roleId}/sidebar-menu`;
}

export async function fetchRoleSidebarMenuState(roleId: number): Promise<RoleSidebarMenuState> {
  const res = await apiFetch(base(roleId), { cache: "no-store" });
  if (res.status === 404) {
    throw new Error("Không tìm thấy vai trò");
  }
  if (!res.ok) {
    throw new Error(`Không tải được cấu hình menu (${res.status})`);
  }
  return res.json();
}

export async function updateRoleSidebarMenu(
  roleId: number,
  body: RoleSidebarMenuUpdatePayload
): Promise<RoleSidebarMenuState> {
  const res = await apiFetch(base(roleId), {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Lưu thất bại"), {
      apiError: err,
    });
  }
  return res.json();
}
