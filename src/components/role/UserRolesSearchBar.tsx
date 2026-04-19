"use client";

import { FaIcon } from "@/components/FaIcon";
import { RoleSearchSuggestInput } from "@/components/role/RoleSearchSuggestInput";
import type { RoleSuggestion } from "@/lib/types/role";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type BarProps = {
  initialQ: string;
  /** Giao diện cổng người dùng (indigo) thay vì nút/input AdminLTE. */
  variant?: "lte" | "user";
};

export function UserRolesSearchBar({ initialQ, variant = "lte" }: BarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialQ);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ khi đổi URL từ phân trang
    setValue(initialQ);
  }, [initialQ]);

  function submit() {
    const p = new URLSearchParams();
    p.set("page", "0");
    const t = value.trim();
    if (t) p.set("q", t);
    router.push(`/user/roles?${p.toString()}`);
  }

  const inputClass =
    variant === "user"
      ? "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      : undefined;
  const btnClass =
    variant === "user"
      ? "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      : "lte-btn lte-btn-primary lte-btn-sm shrink-0";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <RoleSearchSuggestInput
        value={value}
        onChange={setValue}
        onPickSuggestion={(s: RoleSuggestion) => {
          const term = s.roleName.trim();
          setValue(term);
          router.push(`/user/roles?page=0&q=${encodeURIComponent(term)}`);
        }}
        placeholder="Tìm theo mã, tên, mô tả…"
        inputClassName={
          inputClass ?? "lte-input w-full pl-10"
        }
      />
      <button type="submit" className={btnClass}>
        <FaIcon icon="fa-solid fa-magnifying-glass" />
        Tìm kiếm
      </button>
    </form>
  );
}
