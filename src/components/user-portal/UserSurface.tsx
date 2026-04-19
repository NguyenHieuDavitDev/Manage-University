import { FaIcon } from "@/components/FaIcon";

type Props = {
  title?: string;
  titleIcon?: string;
  children: React.ReactNode;
  className?: string;
};

/** Khối nội dung kiểu “thẻ” cho cổng người dùng — không dùng AdminLTE. */
export function UserSurface({ title, titleIcon, children, className = "" }: Props) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 ${className}`}
    >
      {title && (
        <h2 className="mb-6 flex items-center gap-2.5 text-lg font-semibold tracking-tight text-slate-900">
          {titleIcon && (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <FaIcon icon={titleIcon} />
            </span>
          )}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
