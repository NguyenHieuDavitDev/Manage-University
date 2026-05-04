import { UserPageHeading } from "@/components/user-portal/UserPageHeading";
import { UserSurface } from "@/components/user-portal/UserSurface";
import { FaIcon } from "@/components/FaIcon";
import Link from "next/link";

export default function UserHomePage() {
  return (
    <>
      <UserPageHeading
        title="Xin chào"
        description="Đây là không gian dành cho sinh viên: đăng ký học phần, xem lịch học, lịch thi và tra cứu điểm số."
        breadcrumbs={[{ label: "Trang chủ" }]}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <UserSurface title="Bắt đầu nhanh" titleIcon="fa-solid fa-compass">
          <p className="text-sm leading-relaxed text-slate-600">
            Bạn có thể bắt đầu từ đăng ký học phần, sau đó theo dõi lịch học, lịch thi và điểm số ở các mục bên dưới.
          </p>
          <Link
            href="/user/course-enrollment"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <FaIcon icon="fa-solid fa-shield-halved" />
            Đăng ký học phần
          </Link>
        </UserSurface>
        <UserSurface title="Liên kết" titleIcon="fa-solid fa-link">
          <ul className="space-y-3">
            <li>
              <Link
                href="/user/study-schedule"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-indigo-200">
                  <FaIcon icon="fa-solid fa-list-ul" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Lịch học
                  </span>
                  <span className="text-sm text-slate-500">Theo các lớp đã đăng ký</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/user/exam-schedule"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-slate-200 hover:bg-white"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                  <FaIcon icon="fa-solid fa-calendar-check" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Lịch thi</span>
                  <span className="text-sm text-slate-500">Xem lịch thi từng học phần</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/user/scores"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-indigo-200">
                  <FaIcon icon="fa-solid fa-square-poll-vertical" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Điểm số</span>
                  <span className="text-sm text-slate-500">Xem điểm thành phần và tổng kết</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500"
                />
              </Link>
            </li>
            <li>
              <Link
                href="/user/tuition"
                className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-pink-200 hover:bg-pink-50/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pink-600 text-white shadow-sm">
                  <FaIcon icon="fa-solid fa-money-check-dollar" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">Học phí</span>
                  <span className="text-sm text-slate-500">Thanh toán nhiều lần qua MoMo</span>
                </span>
                <FaIcon
                  icon="fa-solid fa-chevron-right"
                  className="ml-auto text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-pink-500"
                />
              </Link>
            </li>
          </ul>
        </UserSurface>
      </div>
    </>
  );
}
