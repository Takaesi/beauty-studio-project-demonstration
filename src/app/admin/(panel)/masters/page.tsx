import Link from "next/link";
import { ToggleButton } from "@/components/admin/catalog-forms";
import { FormAlert } from "@/components/field";
import { Portrait } from "@/components/portrait";
import { prisma } from "@/lib/db";

export const metadata = { title: "Мастера" };

export default async function AdminMastersPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const masters = await prisma.master.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    include: { _count: { select: { services: true, workDays: { where: { workDate: { gte: new Date() } } } } } },
  });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[44px] md:text-[56px]">Мастера</h1>
        <Link href="/admin/masters/new" className="btn btn-primary btn-sm">+ Мастер</Link>
      </div>
      {sp.saved && <div className="mt-6"><FormAlert tone="success">Сохранено</FormAlert></div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {masters.map((m) => (
          <div key={m.id} className={`card flex gap-5 p-4 ${m.isActive ? "" : "opacity-60"}`}>
            <div className="w-20 shrink-0"><Portrait name={m.name} photoUrl={m.photoUrl} sizes="80px" /></div>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/admin/masters/${m.id}`} className="font-medium underline-offset-4 hover:underline">{m.name}</Link>
              <span className="text-[13px] text-muted">{m.title || "—"}</span>
              <span className="mt-2 text-[12px] text-muted">
                Услуг: {m._count.services} · рабочих дней впереди: {m._count.workDays}
              </span>
              <div className="mt-auto flex gap-4 pt-3">
                <Link href={`/admin/schedule?masterId=${m.id}`} className="text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline">График</Link>
                <ToggleButton id={m.id} kind="master" isActive={m.isActive} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
