import Link from "next/link";
import { notFound } from "next/navigation";
import { MasterForm } from "@/components/admin/catalog-forms";
import { prisma } from "@/lib/db";

export const metadata = { title: "Мастер" };

export default async function AdminMasterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const master = isNew ? null : await prisma.master.findUnique({ where: { id: Number(id) || 0 }, include: { services: true } });
  if (!isNew && !master) notFound();
  const [services, futureBookings] = await Promise.all([
    prisma.service.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }] }),
    master ? prisma.booking.count({ where: { masterId: master.id, status: "CONFIRMED", startAt: { gte: new Date() } } }) : 0,
  ]);
  return (
    <div>
      <Link href="/admin/masters" className="text-[13px] text-muted hover:text-ink">← Все мастера</Link>
      <h1 className="display mt-4 mb-10 text-[44px]">{master ? master.name : "Новый мастер"}</h1>
      <MasterForm
        master={
          master
            ? { id: master.id, name: master.name, title: master.title, bio: master.bio, photoUrl: master.photoUrl, isActive: master.isActive, serviceIds: master.services.map((s) => s.serviceId) }
            : undefined
        }
        services={services.map((s) => ({ id: s.id, name: s.name, hint: `${s.durationMin} мин`, inactive: !s.isActive }))}
        futureBookings={futureBookings}
      />
    </div>
  );
}
