export interface AuthDisplayPermission {
  permissionCode: string;
  permissionName: string;
  visibleInAdminPortal: boolean;
  visibleInUserPortal: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  defaultRoute: string;
  displayPermissions?: AuthDisplayPermission[];
}

export interface AuthMeResponse {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  defaultRoute: string;
  displayPermissions?: AuthDisplayPermission[];
}
