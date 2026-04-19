import { FaIcon } from "@/components/FaIcon";

type Props = {
  title: string;
  titleIcon?: string;
  children: React.ReactNode;
  tools?: React.ReactNode;
  id?: string;
};

export function LteCard({ title, titleIcon, children, tools, id }: Props) {
  return (
    <div
      id={id}
      className="lte-card group overflow-hidden rounded-2xl border border-[#e8ecf0] bg-white shadow-[0_4px_24px_rgba(44,62,80,0.06)] transition-shadow duration-200 hover:shadow-[0_8px_32px_rgba(44,62,80,0.09)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef2f6] bg-gradient-to-r from-[#fafcfd] to-white px-4 py-3.5 sm:px-5">
        <h3 className="flex min-w-0 items-center gap-2.5 text-base font-semibold tracking-tight text-[#2c3e50]">
          {titleIcon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3c8dbc]/10 text-[#3c8dbc]">
              <FaIcon icon={titleIcon} className="text-lg" />
            </span>
          )}
          <span className="truncate">{title}</span>
        </h3>
        {tools}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
