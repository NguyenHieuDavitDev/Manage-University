import Link from "next/link";

export type UserBreadcrumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: UserBreadcrumb[];
};

export function UserPageHeading({ title, description, breadcrumbs }: Props) {
  return (
    <header className="mb-8 sm:mb-10">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
            {breadcrumbs.map((b, i) => (
              <li key={`${b.label}-${i}`} className="flex items-center gap-2">
                {i > 0 && (
                  <span className="text-slate-300" aria-hidden>
                    /
                  </span>
                )}
                {b.href ? (
                  <Link
                    href={b.href}
                    className="font-medium text-indigo-600 transition hover:text-indigo-800"
                  >
                    {b.label}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-700">{b.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
          {description}
        </p>
      )}
    </header>
  );
}
