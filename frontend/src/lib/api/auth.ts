import { apiFetch } from "@/lib/apiFetch";
import { getApiBaseUrl } from "@/lib/config";
import type { ApiErrorBody } from "@/lib/types/common";
import type { AuthMeResponse, AuthResponse } from "@/lib/types/auth";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

function authBase(): string {
  return `${getApiBaseUrl()}/api/v1/auth`;
}

export async function loginRequest(
  usernameOrEmail: string,
  password: string
): Promise<AuthResponse> {
  const res = await fetch(`${authBase()}/login`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ usernameOrEmail, password }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Đăng nhập thất bại"), {
      apiError: err,
    });
  }
  return res.json();
}

export async function registerRequest(body: {
  username: string;
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${authBase()}/register`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Đăng ký thất bại"), {
      apiError: err,
    });
  }
  return res.json();
}

export async function fetchMe(init?: RequestInit): Promise<AuthMeResponse> {
  const res = await apiFetch(`${authBase()}/me`, { cache: "no-store", ...init });
  if (res.status === 401) {
    throw Object.assign(new Error("Phiên đăng nhập hết hạn"), { status: 401 });
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw Object.assign(new Error(err?.message || "Không tải được thông tin tài khoản"), {
      status: res.status,
      apiError: err,
    });
  }
  return res.json();
}
