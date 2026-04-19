import { FaIcon } from "@/components/FaIcon";
import Link from "next/link";

type Props = {
  title: string;
  titleIcon?: string;
  breadcrumbs?: { label: string; href?: string }[];
};

export function ContentHeader({ title, titleIcon, breadcrumbs }: Props) {
  return (
    <section className="lte-content-header mb-5 sm:mb-6">
      <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight text-[#2c3e50] sm:text-[1.65rem]">
        {titleIcon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3c8dbc] to-[#2f7494] text-lg text-white shadow-md">
            <FaIcon icon={titleIcon} />
          </span>
        )}
        {title}
      </h1>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mt-2">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-[#6c757d]">
            {breadcrumbs.map((b, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <FaIcon
                    icon="fa-solid fa-angle-right"
                    className="mx-0.5 text-[10px] text-[#adb5bd]"
                    aria-hidden
                  />
                )}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="rounded px-1 py-0.5 font-medium text-[#3c8dbc] hover:bg-[#3c8dbc]/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3c8dbc]/30"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span
                    className={
                      i === breadcrumbs.length - 1
                        ? "font-medium text-[#495057]"
                        : ""
                    }
                  >
                    {b.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
    </section>
  );
}
