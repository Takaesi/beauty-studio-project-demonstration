import type { ReactNode } from "react";

export function AuthShell({ eyebrow, title, lead, children }: { eyebrow: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="wrap grid items-center gap-16 py-16 md:grid-cols-2 md:py-24">
      <div className="hidden md:block">
        <div className="arch placeholder-photo mx-auto aspect-[4/5] w-full max-w-[420px]" aria-hidden />
      </div>
      <div className="mx-auto w-full max-w-[420px]">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="display mt-4 text-[48px] md:text-[60px]">{title}</h1>
        {lead && <p className="mt-4 text-[15px] text-ink-soft">{lead}</p>}
        <div className="mt-10">{children}</div>
      </div>
    </div>
  );
}
