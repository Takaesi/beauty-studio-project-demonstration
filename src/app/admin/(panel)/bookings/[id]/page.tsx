import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCancelButton, AdminRescheduleForm } from "@/components/admin/booking-forms";
import { FormAlert } from "@/components/field";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import { formatDayMonth, formatPrice, minToHHMM, toSalonParts, weekdayFull } from "@/lib/time";

export const metadata = { title: "Запись" };

export default async function AdminBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; moved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const b = await prisma.booking.findUnique({
    where: { id: Number(id) || 0 },
    include: { service: true, master: true, client: true },
  });
  if (!b) notFound();
  const p = toSalonParts(b.startAt);
  const isActive = b.status === "CONFIRMED";
  const isFuture = b.startAt > new Date();

  return (
    <div className="max-w-5xl">
      <Link href={`/admin?date=${p.date}`} className="text-[13px] text-muted hover:text-ink">← К записям на {formatDayMonth(p.date)}</Link>
      {sp.created && <div className="mt-6"><FormAlert tone="success">Запись создана</FormAlert></div>}
      {sp.moved && <div className="mt-6"><FormAlert tone="success">Запись перенесена, статус «Подтверждена» сохранён</FormAlert></div>}

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Запись № {b.id} · {isActive ? "Подтверждена" : "Отменена"}{b.cancelledBy ? ` (${b.cancelledBy === "admin" ? "администратором" : "клиентом"})` : ""}</p>
          <h1 className={`display mt-2 text-[44px] md:text-[56px] ${isActive ? "" : "text-muted line-through decoration-1"}`}>
            {formatDayMonth(p.date)}, {minToHHMM(p.minutes)}–{minToHHMM(p.minutes + b.durationMinAtBooking)}
          </h1>
          <p className="text-muted">{weekdayFull(p.date)}</p>
        </div>
        {isActive && <AdminCancelButton bookingId={b.id} />}
      </div>

      <dl className="card mt-8 grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <div><dt className="label">Клиент</dt><dd className="text-[17px]">{b.contactName}</dd>
          {b.client.name !== b.contactName && <dd className="text-[12px] text-muted">в профиле: {b.client.name}</dd>}</div>
        <div><dt className="label">Телефон</dt><dd className="text-[17px] tabular-nums"><a href={`tel:${b.contactPhone}`} className="hover:text-accent">{formatPhone(b.contactPhone)}</a></dd></div>
        <div><dt className="label">Источник</dt><dd>{b.createdBy === "admin" ? "Администратор (по телефону)" : "Онлайн-запись"}</dd></div>
        <div><dt className="label">Услуга</dt><dd>{b.service.name}</dd></div>
        <div><dt className="label">Мастер</dt><dd>{b.master.name}</dd></div>
        <div><dt className="label">Стоимость · длительность</dt><dd>{formatPrice(b.priceAtBooking)} · {b.durationMinAtBooking} мин</dd></div>
      </dl>

      {isActive && isFuture && (
        <section className="mt-12">
          <h2 className="display mb-6 text-[30px]">Перенести</h2>
          <AdminRescheduleForm
            bookingId={b.id}
            masterId={b.masterId}
            durationMin={b.durationMinAtBooking}
            defaults={{ date: p.date, time: minToHHMM(p.minutes) }}
          />
        </section>
      )}
    </div>
  );
}
