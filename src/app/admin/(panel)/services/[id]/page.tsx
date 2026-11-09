import Link from "next/link";
import { notFound } from "next/navigation";
import { ServiceForm } from "@/components/admin/catalog-forms";
import { prisma } from "@/lib/db";

export const metadata = { title: "Услуга" };

export default async function AdminServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const service = isNew
    ? null
    : await prisma.service.findUnique({ where: { id: Number(id) || 0 }, include: { masters: true } });
  if (!isNew && !service) notFound();
  const [masters, cats, futureBookings] = await Promise.all([
    prisma.master.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    prisma.service.findMany({ distinct: ["category"], select: { category: true } }),
    service ? prisma.booking.count({ where: { serviceId: service.id, status: "CONFIRMED", startAt: { gte: new Date() } } }) : 0,
  ]);
  return (
    <div>
      <Link href="/admin/services" className="text-[13px] text-muted hover:text-ink">← Все услуги</Link>
      <h1 className="display mt-4 mb-10 text-[44px]">{service ? service.name : "Новая услуга"}</h1>
      <ServiceForm
        service={
          service
            ? {
                id: service.id,
                name: service.name,
                category: service.category,
                description: service.description,
                price: service.price.toString(),
                durationMin: service.durationMin,
                isActive: service.isActive,
                masterIds: service.masters.map((m) => m.masterId),
              }
            : undefined
        }
        masters={masters.map((m) => ({ id: m.id, name: m.name, inactive: !m.isActive }))}
        categories={cats.map((c) => c.category).filter(Boolean)}
        futureBookings={futureBookings}
      />
    </div>
  );
}
