import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { formatMoment } from "@/lib/time";

export const metadata = { title: "Клиенты" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const digits = q.replace(/\D/g, "");
  const clients = await prisma.client.findMany({
    where: q
      ? { OR: [{ name: { contains: q, mode: "insensitive" } }, ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : [])] }
      : undefined,
    include: {
      bookings: { where: { status: "CONFIRMED" }, orderBy: { startAt: "desc" }, take: 1, include: { service: true } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="display text-[44px] md:text-[56px]">Клиенты</h1>
      <form className="mt-6 max-w-md">
        <input name="q" defaultValue={q} placeholder="Имя или телефон" className="input" />
      </form>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr className="border-b border-line">
              <th className="py-3 pr-4 font-medium">Имя</th>
              <th className="py-3 pr-4 font-medium">Телефон</th>
              <th className="py-3 pr-4 font-medium">Кабинет</th>
              <th className="py-3 pr-4 text-right font-medium">Записей</th>
              <th className="py-3 font-medium">Последняя запись</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-b border-line/70">
                <td className="py-3 pr-4">{c.name}</td>
                <td className="py-3 pr-4 tabular-nums"><a href={`tel:${c.phone}`} className="hover:text-accent">{formatPhone(c.phone)}</a></td>
                <td className="py-3 pr-4 text-[13px] text-muted">{c.passwordHash ? "есть" : "нет"}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{c._count.bookings}</td>
                <td className="py-3 text-[13px]">{c.bookings[0] ? `${formatMoment(c.bookings[0].startAt)} · ${c.bookings[0].service.name}` : "—"}</td>
              </tr>
            ))}
            {!clients.length && (
              <tr><td colSpan={5} className="py-8 text-center text-muted">Никого не нашли</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
