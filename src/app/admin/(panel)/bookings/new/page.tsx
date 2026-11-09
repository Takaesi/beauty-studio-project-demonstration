import Link from "next/link";
import { AdminNewBookingForm } from "@/components/admin/booking-forms";
import { prisma } from "@/lib/db";
import { isDateStr, todaySalon } from "@/lib/time";

export const metadata = { title: "Новая запись" };

export default async function NewBookingPage({ searchParams }: { searchParams: Promise<{ date?: string; masterId?: string }> }) {
  const sp = await searchParams;
  const [services, masters] = await Promise.all([
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { masters: { where: { master: { isActive: true } } } },
    }),
    prisma.master.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  const date = isDateStr(sp.date) ? sp.date : todaySalon();
  return (
    <div className="max-w-5xl">
      <Link href={`/admin?date=${date}`} className="text-[13px] text-muted hover:text-ink">← К записям</Link>
      <h1 className="display mt-4 mb-10 text-[44px]">Новая запись</h1>
      <AdminNewBookingForm
        services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, masterIds: s.masters.map((m) => m.masterId) }))}
        masters={masters.map((m) => ({ id: m.id, name: m.name }))}
        defaults={{ date, masterId: Number(sp.masterId) || undefined }}
      />
    </div>
  );
}
