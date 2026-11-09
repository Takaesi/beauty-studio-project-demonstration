import Link from "next/link";
import { ToggleButton } from "@/components/admin/catalog-forms";
import { FormAlert } from "@/components/field";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/time";

export const metadata = { title: "Услуги" };

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const sp = await searchParams;
  const services = await prisma.service.findMany({
    orderBy: [{ isActive: "desc" }, { category: "asc" }, { sortOrder: "asc" }],
    include: { masters: { include: { master: true } } },
  });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[44px] md:text-[56px]">Услуги</h1>
        <Link href="/admin/services/new" className="btn btn-primary btn-sm">+ Услуга</Link>
      </div>
      {sp.saved && <div className="mt-6"><FormAlert tone="success">Сохранено</FormAlert></div>}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-[14px]">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr className="border-b border-line">
              <th className="py-3 pr-4 font-medium">Услуга</th>
              <th className="py-3 pr-4 font-medium">Категория</th>
              <th className="py-3 pr-4 text-right font-medium">Цена</th>
              <th className="py-3 pr-4 text-right font-medium">Мин</th>
              <th className="py-3 pr-4 font-medium">Мастера</th>
              <th className="py-3 font-medium">На сайте</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className={`border-b border-line/70 ${s.isActive ? "" : "text-muted"}`}>
                <td className="py-3 pr-4">
                  <Link href={`/admin/services/${s.id}`} className="font-medium underline-offset-4 hover:underline">{s.name}</Link>
                </td>
                <td className="py-3 pr-4">{s.category}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatPrice(s.price)}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{s.durationMin}</td>
                <td className="py-3 pr-4 text-[13px]">
                  {s.masters.length ? s.masters.map((m) => m.master.name.split(" ")[0]).join(", ") : <span className="text-danger">нет мастеров</span>}
                </td>
                <td className="py-3">
                  <span className="mr-3">{s.isActive ? "Да" : "Скрыта"}</span>
                  <ToggleButton id={s.id} kind="service" isActive={s.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
