import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { FaIcon } from "@/components/FaIcon";
import Link from "next/link";

export default function UserHomePage() {
  return (
    <>
      <UserPageHeading
        title="Xin chào"
        description="Đây là không gian dành cho thành viên: xem và tra cứu vai trò ở chế độ chỉ đọc. Thao tác quản trị (thêm, sửa, xóa) nằm ở cổng quản trị."
        breadcrumbs={[{ label: "Trang chủ" }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <UserSurface title="Bắt đầu nhanh" titleIcon="fa-solid fa-compass">
          <p className="text-sm leading-relaxed text-slate-600">
            Mở danh sách vai trò để tìm theo mã, tên hoặc mô tả — có gợi ý khi gõ.
          </p>
          <Link
            href="/user/roles"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FaIcon icon="fa-solid fa-shield-halved" />
            Xem vai trò
          </Link>
        </UserSurface>
        <UserSurface title="Liên kết" titleIcon="fa-solid fa-link">
          <ul className="space-y-3">
            <li>
              <Link
                href="/user/roles"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-indigo-200">
                  <FaIcon icon="fa-solid fa-list-ul" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Danh sách vai trò
                  </span>
                  <span className="text-sm text-slate-500">Phân trang &amp; tìm kiếm</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                  <FaIcon icon="fa-solid fa-screwdriver-wrench" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Cổng quản trị</span>
                  <span className="text-sm text-slate-500">
                    Chỉ dành cho tài khoản được phép
                  </span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/user/chat"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-indigo-200">
                  <FaIcon icon="fa-solid fa-robot" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Trợ lý AI</span>
                  <span className="text-sm text-slate-500">Hỏi bất kỳ điều gì với Gemini AI</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />
              </Link>
            </li>
          </ul>
        </UserSurface>
      </div>
    </>
  );
}
