import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RescheduleFlow } from "@/components/booking-actions";
import { requireClient } from "@/lib/auth";
import { getClientSlots } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { formatMoment } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Перенос записи" };

export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await requireClient(`/account/bookings/${id}/reschedule`);
  const b = await prisma.booking.findUnique({ where: { id: Number(id) || 0 }, include: { service: true, master: true } });
  if (!b || b.clientId !== client.id || b.status !== "CONFIRMED" || b.startAt < new Date()) notFound();
  const days = await getClientSlots({
    serviceId: b.serviceId,
    masterId: b.masterId,
    durationMin: b.durationMinAtBooking,
    excludeBookingId: b.id,
  });

  return (
    <div className="wrap py-14 md:py-20">
      <Link href={`/account/bookings/${b.id}`} className="text-[13px] text-muted hover:text-ink">← К записи</Link>
      <p className="eyebrow mt-8">Перенос записи</p>
      <h1 className="display mt-4 text-[40px] md:text-[60px]">{b.service.name}</h1>
      <p className="mt-2 mb-12 text-ink-soft">
        {b.master.name} · сейчас: {formatMoment(b.startAt)}
      </p>
      <RescheduleFlow bookingId={b.id} serviceId={b.serviceId} masterId={b.masterId} initialDays={days} />
    </div>
  );
}
