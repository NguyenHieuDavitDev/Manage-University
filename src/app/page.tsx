import { FaIcon } from "@/components/FaIcon";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      >
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#3c8dbc]/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#00a65a]/15 blur-3xl" />
      </div>
      <div className="relative mb-12 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4a9ac7] to-[#2f7494] text-2xl text-white shadow-lg ring-4 ring-white/80">
          <FaIcon icon="fa-solid fa-graduation-cap" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2c3e50] md:text-4xl">
          ST Manager
        </h1>
        <p className="mt-2 max-w-md text-[#6c757d] md:text-lg">
          Quản lý vai trò — giao diện hiện đại, dễ điều hướng
        </p>
      </div>
      <div className="relative mb-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="lte-btn lte-btn-primary lte-btn-sm px-5 py-2.5 shadow-md"
        >
          <FaIcon icon="fa-solid fa-right-to-bracket" />
          Đăng nhập
        </Link>
        <Link
          href="/register"
          className="lte-btn lte-btn-ghost lte-btn-sm border border-[#d0d7de] px-5 py-2.5 shadow-sm"
        >
          <FaIcon icon="fa-solid fa-user-plus" />
          Đăng ký
        </Link>
      </div>
      <div className="relative grid w-full max-w-3xl gap-5 sm:grid-cols-2">
        <Link
          href="/user"
          className="group relative overflow-hidden rounded-2xl border border-[#e3e8ec] bg-white/90 p-8 shadow-[0_8px_40px_rgba(44,62,80,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00a65a]/35 hover:shadow-[0_16px_48px_rgba(0,166,90,0.12)]"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#26c281] to-[#00a65a] text-xl text-white shadow-md transition-transform duration-200 group-hover:scale-105">
            <FaIcon icon="fa-solid fa-user-group" />
          </div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#2c3e50]">
            Cổng người dùng
            <FaIcon
              icon="fa-solid fa-arrow-right"
              className="text-sm text-[#adb5bd] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6c757d]">
            Tra cứu danh sách và chi tiết vai trò ở chế độ chỉ đọc.
          </p>
        </Link>
        <Link
          href="/admin"
          className="group relative overflow-hidden rounded-2xl border border-[#e3e8ec] bg-white/90 p-8 shadow-[0_8px_40px_rgba(44,62,80,0.08)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#3c8dbc]/45 hover:shadow-[0_16px_48px_rgba(60,141,188,0.15)]"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5aa5cf] to-[#2f7494] text-xl text-white shadow-md transition-transform duration-200 group-hover:scale-105">
            <FaIcon icon="fa-solid fa-screwdriver-wrench" />
          </div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#2c3e50]">
            Cổng quản trị
            <FaIcon
              icon="fa-solid fa-arrow-right"
              className="text-sm text-[#adb5bd] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
            />
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#6c757d]">
            Bảng điều khiển và quản lý vai trò đầy đủ.
          </p>
        </Link>
      </div>
    </div>
  );
}
