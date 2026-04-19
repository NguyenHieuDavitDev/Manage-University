import type { ApiErrorBody, SpringPage } from "@/lib/types/common";

export type { ApiErrorBody, SpringPage };

export interface Role {
  id: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RolePayload {
  roleCode: string;
  roleName: string;
  description?: string | null;
}

/** Gợi ý realtime từ GET /roles/suggestions */
export interface RoleSuggestion {
  id: number;
  roleCode: string;
  roleName: string;
}
