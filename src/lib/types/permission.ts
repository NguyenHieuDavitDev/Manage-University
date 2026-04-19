import type { ApiErrorBody, SpringPage } from "@/lib/types/common";

export type { ApiErrorBody, SpringPage };

export interface LinkedRole {
  id: number;
  roleCode: string;
  roleName: string;
}

export interface Permission {
  id: number;
  permissionCode: string;
  permissionName: string;
  description: string | null;
  visibleInAdminPortal?: boolean;
  visibleInUserPortal?: boolean;
  linkedRoles?: LinkedRole[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionPayload {
  permissionCode: string;
  permissionName: string;
  description?: string | null;
  visibleInAdminPortal: boolean;
  visibleInUserPortal: boolean;
  roleIds: number[];
}

export interface PermissionSuggestion {
  id: number;
  permissionCode: string;
  permissionName: string;
}
