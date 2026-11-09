import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientBookingActions } from "@/components/booking-actions";
import { FormAlert } from "@/components/field";
import { SALON } from "@/config/salon";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { formatMoment, formatPrice, toSalonParts, weekdayFull } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Запись" };

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; moved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const client = await requireClient(`/account/bookings/${id}`);
  const b = await prisma.booking.findUnique({ where: { id: Number(id) || 0 }, include: { service: true, master: true } });
  if (!b || b.clientId !== client.id) notFound();

  const isUpcoming = b.status === "CONFIRMED" && b.startAt > new Date();
  const status = b.status === "CANCELLED" ? "Отменена" : isUpcoming ? "Подтверждена" : "Состоялась";

  return (
    <div className="wrap max-w-3xl py-14 md:py-20">
      <Link href="/account" className="text-[13px] text-muted hover:text-ink">← Мои записи</Link>

      {sp.created && b.status === "CONFIRMED" && (
        <div className="mt-8">
          {/* AC-03.1 */}
          <FormAlert tone="success">
            Вы записаны: {lowerFirst(b.service.name)}, мастер {b.master.name}, {formatMoment(b.startAt)}. Адрес: {SALON.address}
          </FormAlert>
        </div>
      )}
      {sp.moved && b.status === "CONFIRMED" && (
        <div className="mt-8">
          <FormAlert tone="success">Запись перенесена на {formatMoment(b.startAt)}</FormAlert>
        </div>
      )}

      <p className="eyebrow mt-10">Запись № {b.id} · {status}</p>
      <h1 className="display mt-4 text-[44px] md:text-[64px]">{formatMoment(b.startAt)}</h1>
      <p className="mt-1 text-muted">{weekdayFull(toSalonParts(b.startAt).date)}</p>

      <dl className="card mt-10 grid gap-6 p-6 sm:grid-cols-2 md:p-8">
        <div><dt className="label">Услуга</dt><dd>{b.service.name}</dd></div>
        <div><dt className="label">Мастер</dt><dd>{b.master.name}</dd></div>
        <div><dt className="label">Длительность</dt><dd>{b.durationMinAtBooking} мин</dd></div>
        <div><dt className="label">Стоимость</dt><dd>{formatPrice(b.priceAtBooking)}</dd></div>
        <div><dt className="label">Контакт</dt><dd>{b.contactName}, {formatPhone(b.contactPhone)}</dd></div>
        <div><dt className="label">Адрес</dt><dd>{SALON.address}<span className="block text-[13px] text-muted">{SALON.metro}</span></dd></div>
      </dl>

      {isUpcoming && (
        <div className="mt-8">
          <ClientBookingActions bookingId={b.id} />
        </div>
      )}
    </div>
  );
}
