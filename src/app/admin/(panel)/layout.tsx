import type { Metadata } from "next";
import Link from "next/link";
import { adminLogoutAction } from "@/actions/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { SALON } from "@/config/salon";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Админка", template: `%s · Админка` }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-line bg-paper lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:px-5 lg:py-8">
          <Link href="/admin" className="block leading-none">
            <span className="display text-[22px]">{SALON.name}</span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.3em] text-muted">Администратор</span>
          </Link>
          <div className="flex items-center gap-4 lg:hidden">
            <Link href="/" className="text-[12px] text-muted hover:text-ink">Сайт ↗</Link>
            <form action={adminLogoutAction}>
              <button className="text-[12px] text-muted hover:text-ink">Выйти</button>
            </form>
          </div>
        </div>
        <div className="px-3 pb-3 lg:px-0 lg:pt-2">
          <AdminNav />
        </div>
        <div className="absolute bottom-8 left-5 hidden flex-col gap-2 text-[13px] lg:flex">
          <Link href="/" className="text-muted hover:text-ink">Открыть сайт ↗</Link>
          <form action={adminLogoutAction}>
            <button className="text-muted hover:text-ink">Выйти</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
