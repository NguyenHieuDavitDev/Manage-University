"use client";

import { FaIcon } from "@/components/FaIcon";
import { loginRequest } from "@/lib/api/auth";
import { writeAuthMeSnapshotFromAuthResponse } from "@/lib/auth-me-snapshot";
import { setAccessToken } from "@/lib/auth-storage";
import { canAccessAdminPortal } from "@/lib/portalRouting";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest(usernameOrEmail.trim(), password);
      setAccessToken(res.accessToken);
      writeAuthMeSnapshotFromAuthResponse(res);
      const next = searchParams.get("next");
      const requestedPath =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      const canGoAdmin = canAccessAdminPortal(res.roles ?? []);
      let target = res.defaultRoute || "/user";
      if (requestedPath?.startsWith("/admin") && !canGoAdmin) {
        target = "/user";
      } else if (requestedPath) {
        target = requestedPath;
      }
      // Điều hướng full trang: tránh race router.replace với localStorage / AuthGate sau khi đăng nhập.
      window.location.replace(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f4f7f9] to-[#e8eef3] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#e3e8ec] bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a9ac7] to-[#2f7494] text-2xl text-white shadow-md">
            <FaIcon icon="fa-solid fa-right-to-bracket" />
          </div>
          <h1 className="text-xl font-bold text-[#2c3e50]">Đăng nhập</h1>
          <p className="mt-1 text-sm text-[#6c757d]">ST Manager — JWT</p>
        </div>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">
              Username hoặc email
            </label>
            <input
              required
              autoComplete="username"
              className="lte-input w-full"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-[#495057]">Mật khẩu</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              className="lte-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="lte-btn lte-btn-primary lte-btn-sm mt-2 w-full py-2.5"
          >
            {loading ? (
              <>
                <FaIcon icon="fa-solid fa-spinner" className="animate-spin" />
                Đang đăng nhập…
              </>
            ) : (
              <>
                <FaIcon icon="fa-solid fa-right-to-bracket" />
                Đăng nhập
              </>
            )}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#6c757d]">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-[#3c8dbc] hover:underline">
            Đăng ký
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
