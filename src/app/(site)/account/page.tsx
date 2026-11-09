import type { Metadata } from "next";
import Link from "next/link";
import { ClientBookingActions } from "@/components/booking-actions";
import { ProfileForm } from "@/components/profile-form";
import { requireClient } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoment, formatPrice } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Личный кабинет" };

export default async function AccountPage() {
  const client = await requireClient("/account");
  const now = new Date();
  const [upcoming, history] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: client.id, status: "CONFIRMED", startAt: { gte: now } },
      include: { service: true, master: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { clientId: client.id, OR: [{ status: "CANCELLED" }, { startAt: { lt: now } }] },
      include: { service: true, master: true },
      orderBy: { startAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div className="wrap py-14 md:py-20">
      <p className="eyebrow">Личный кабинет</p>
      <h1 className="display mt-4 text-[48px] md:text-[72px]">Здравствуйте, {client.name}</h1>

      <div className="mt-14 grid gap-14 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="display text-[32px]">Предстоящие визиты</h2>
            <Link href="/services" className="btn btn-primary btn-sm">Новая запись</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="display text-[26px]">Пока нет записей</p>
              <p className="mt-2 text-[14px] text-muted">Выберите услугу — свободное время покажем сразу.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {upcoming.map((b) => (
                <li key={b.id} className="card grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
                  <Link href={`/account/bookings/${b.id}`} className="group">
                    <p className="display text-[30px] leading-tight group-hover:text-accent">{formatMoment(b.startAt)}</p>
                    <p className="mt-2 text-[15px]">{b.service.name}</p>
                    <p className="text-[13px] text-muted">
                      {b.master.name} · {b.durationMinAtBooking} мин · {formatPrice(b.priceAtBooking)}
                    </p>
                  </Link>
                  <ClientBookingActions bookingId={b.id} />
                </li>
              ))}
            </ul>
          )}

          {history.length > 0 && (
            <>
              <h2 className="display mt-16 mb-6 text-[28px]">История</h2>
              <ul className="divide-y divide-line border-y border-line">
                {history.map((b) => (
                  <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-3 py-4 text-[14px]">
                    <span>
                      {formatMoment(b.startAt)} · {b.service.name}
                      <span className="text-muted"> · {b.master.name}</span>
                    </span>
                    <span className={b.status === "CANCELLED" ? "text-muted" : ""}>
                      {b.status === "CANCELLED" ? "Отменена" : "Состоялась"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <aside>
          <ProfileForm name={client.name} phone={client.phone} />
        </aside>
      </div>
    </div>
  );
}
