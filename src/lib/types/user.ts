import type { ApiErrorBody, SpringPage } from "@/lib/types/common";

export type { ApiErrorBody, SpringPage };

export type UserStatus = "Active" | "Inactive" | "Locked";

export interface UserRoleSummary {
  id: number;
  roleCode: string;
  roleName: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  fullName: string;
  dob: string | null;
  gender: string | null;
  cccd: string | null;
  passport: string | null;
  address: string | null;
  currentAddress: string | null;
  personalEmail: string | null;
  avatarUrl: string | null;
  nationality: string | null;
  ethnicity: string | null;
  maritalStatus: string | null;
  isEmailVerified: boolean | null;
  isPhoneVerified: boolean | null;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
  failedLoginCount: number | null;
  lockoutEnd: string | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  roles?: UserRoleSummary[];
}

export interface UserCreatePayload {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  status?: UserStatus | null;
  fullName: string;
  dob?: string | null;
  gender?: string | null;
  cccd?: string | null;
  passport?: string | null;
  address?: string | null;
  currentAddress?: string | null;
  personalEmail?: string | null;
  avatarUrl?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  maritalStatus?: string | null;
  /** Id vai trò (bảng roles), lưu qua bảng liên kết user_roles. */
  roleIds?: number[] | null;
}

export interface UserUpdatePayload {
  username: string;
  email: string;
  password?: string | null;
  phoneNumber?: string | null;
  status: UserStatus;
  fullName: string;
  dob?: string | null;
  gender?: string | null;
  cccd?: string | null;
  passport?: string | null;
  address?: string | null;
  currentAddress?: string | null;
  personalEmail?: string | null;
  avatarUrl?: string | null;
  nationality?: string | null;
  ethnicity?: string | null;
  maritalStatus?: string | null;
  /** Gửi mảng (có thể rỗng) để thay thế toàn bộ vai trò khi cập nhật. */
  roleIds?: number[] | null;
}
