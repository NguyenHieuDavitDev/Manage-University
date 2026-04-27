"use client";

import { FaIcon } from "@/components/FaIcon";
import { registerRequest } from "@/lib/api/auth";
import { writeAuthMeSnapshotFromAuthResponse } from "@/lib/auth-me-snapshot";
import { setAccessToken } from "@/lib/auth-storage";
import Link from "next/link";
import { useState } from "react";

export default function RegisterPageClient() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await registerRequest({
        username: username.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });
      setAccessToken(res.accessToken);
      writeAuthMeSnapshotFromAuthResponse(res);
      window.location.replace(res.defaultRoute || "/user");
    } catch (err) {
      const er = err as Error & { apiError?: { details?: Record<string, string>; message?: string } };
      if (er.apiError?.details) setFieldErrors(er.apiError.details);
      setError(er.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f4f7f9] to-[#e8eef3] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#e3e8ec] bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#26c281] to-[#00a65a] text-2xl text-white shadow-md">
            <FaIcon icon="fa-solid fa-user-plus" />
          </div>
          <h1 className="text-xl font-bold text-[#2c3e50]">Đăng ký</h1>
          <p className="mt-1 text-sm text-[#6c757d]">Tài khoản mặc định vai trò USER</p>
        </div>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">Họ và tên</label>
            <input
              required
              className="lte-input w-full"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">Username</label>
            <input
              required
              autoComplete="username"
              className="lte-input w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">Email</label>
            <input
              required
              type="email"
              autoComplete="email"
              className="lte-input w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">Mật khẩu</label>
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
              className="lte-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="lte-btn lte-btn-primary lte-btn-sm mt-2 w-full py-2.5"
          >
            {loading ? (
              <>
                <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                Đang tạo tài khoản…
              </>
            ) : (
              <>
                <FaIcon icon="fa-solid fa-user-plus" />
                Đăng ký
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#6c757d]">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-[#3c8dbc] hover:underline">
            Đăng nhập
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link href="/" className="text-xs text-[#adb5bd] hover:text-[#3c8dbc]">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
