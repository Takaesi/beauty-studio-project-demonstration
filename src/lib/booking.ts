import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { BOOKING_HORIZON_DAYS, checkFits, computeFreeSlots, type FitResult } from "./slots";
import { addDays, dateStrToDb, dbToDateStr, salonToUtc, todaySalon, type DateStr } from "./time";

type Tx = Prisma.TransactionClient;

export type BookingError =
  | "not_found"
  | "not_available" // мастер/услуга скрыты или мастер не выполняет услугу
  | "slot_taken" // AC-03.4
  | "not_enough_time" // AC-10.2
  | "no_workday"
  | "outside_hours"
  | "in_past"
  | "already_cancelled"
  | "forbidden";

export const BOOKING_ERROR_TEXT: Record<BookingError, string> = {
  not_found: "Запись не найдена",
  not_available: "Мастер или услуга сейчас недоступны для записи",
  slot_taken: "Это время уже занято. Выберите другое",
  not_enough_time: "Недостаточно времени для услуги",
  no_workday: "В этот день мастер не работает",
  outside_hours: "Недостаточно времени для услуги: выходит за рабочее время мастера",
  in_past: "Нельзя записать на прошедшее время",
  already_cancelled: "Запись уже отменена",
  forbidden: "Нет доступа к этой записи",
};

type Result<T> = { ok: true; value: T } | { ok: false; error: BookingError };

/** Рабочие дни и занятые интервалы мастера на период. */
async function loadMasterCalendar(
  db: Tx | typeof prisma,
  masterId: number,
  from: DateStr,
  to: DateStr,
  excludeBookingId?: number,
) {
  const [workDays, bookings] = await Promise.all([
    db.workDay.findMany({
      where: { masterId, workDate: { gte: dateStrToDb(from), lte: dateStrToDb(to) } },
    }),
    db.booking.findMany({
      where: {
        masterId,
        status: "CONFIRMED",
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        startAt: { lt: salonToUtc(addDays(to, 1), 0) },
        endAt: { gt: salonToUtc(from, 0) },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);
  return {
    workDays: workDays.map((w) => ({ date: dbToDateStr(w.workDate), startMin: w.startMin, endMin: w.endMin })),
    busy: bookings.map((b) => ({ start: b.startAt, end: b.endAt })),
  };
}

/** Мастер выполняет услугу, оба активны. */
export async function getBookableOffer(serviceId: number, masterId: number, db: Tx | typeof prisma = prisma) {
  const link = await db.masterService.findUnique({
    where: { masterId_serviceId: { masterId, serviceId } },
    include: { master: true, service: true },
  });
  if (!link || !link.master.isActive || !link.service.isActive) return null;
  return link;
}

/** Свободные слоты для клиента на 14 дней (AC-02.2, AC-02.5). */
export async function getClientSlots(params: {
  serviceId: number;
  masterId: number;
  durationMin: number;
  excludeBookingId?: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const from = todaySalon(now);
  const to = addDays(from, BOOKING_HORIZON_DAYS - 1);
  const cal = await loadMasterCalendar(prisma, params.masterId, from, to, params.excludeBookingId);
  return computeFreeSlots({ ...cal, durationMin: params.durationMin, now, fromDate: from });
}

/** Блокировка на уровне мастера: две параллельные записи к одному мастеру выполняются по очереди. */
async function lockMaster(tx: Tx, masterId: number) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(${masterId}::bigint)::text`;
}

async function validateTime(
  tx: Tx,
  p: {
    masterId: number;
    date: DateStr;
    startMin: number;
    durationMin: number;
    by: "client" | "admin";
    excludeBookingId?: number;
  },
): Promise<BookingError | null> {
  const now = new Date();
  if (p.by === "client") {
    // Клиент может выбрать только слот из расписания: шаг 30 минут, ≥ 2 часа, в пределах 14 дней.
    const from = todaySalon(now);
    const to = addDays(from, BOOKING_HORIZON_DAYS - 1);
    const cal = await loadMasterCalendar(tx, p.masterId, from, to, p.excludeBookingId);
    const days = computeFreeSlots({ ...cal, durationMin: p.durationMin, now, fromDate: from });
    const day = days.find((d) => d.date === p.date);
    return day?.slots.includes(p.startMin) ? null : "slot_taken";
  }
  // Администратор: любое время в рабочих часах, без пересечений.
  if (salonToUtc(p.date, p.startMin) < now) return "in_past";
  const cal = await loadMasterCalendar(tx, p.masterId, p.date, p.date, p.excludeBookingId);
  const fit: FitResult = checkFits({
    workDay: cal.workDays[0] ?? null,
    busy: cal.busy,
    date: p.date,
    startMin: p.startMin,
    durationMin: p.durationMin,
  });
  if (fit === "ok") return null;
  if (fit === "overlap") return "not_enough_time";
  return fit;
}

export async function createBooking(p: {
  clientId: number;
  serviceId: number;
  masterId: number;
  date: DateStr;
  startMin: number;
  contactName: string;
  contactPhone: string;
  by: "client" | "admin";
}): Promise<Result<{ id: number }>> {
  return prisma.$transaction(async (tx) => {
    await lockMaster(tx, p.masterId);
    const offer = await getBookableOffer(p.serviceId, p.masterId, tx);
    if (!offer) return { ok: false, error: "not_available" } as const;
    const durationMin = offer.service.durationMin;
    const err = await validateTime(tx, { ...p, durationMin });
    if (err) return { ok: false, error: err } as const;
    const startAt = salonToUtc(p.date, p.startMin);
    const b = await tx.booking.create({
      data: {
        clientId: p.clientId,
        serviceId: p.serviceId,
        masterId: p.masterId,
        startAt,
        endAt: new Date(startAt.getTime() + durationMin * 60_000),
        priceAtBooking: offer.service.price,
        durationMinAtBooking: durationMin,
        contactName: p.contactName,
        contactPhone: p.contactPhone,
        createdBy: p.by,
      },
    });
    return { ok: true, value: { id: b.id } } as const;
  });
}

/** Перенос: статус «Подтверждена» сохраняется, старое время освобождается (AC-10.1). */
export async function rescheduleBooking(p: {
  bookingId: number;
  date: DateStr;
  startMin: number;
  by: "client" | "admin";
  clientId?: number;
}): Promise<Result<{ id: number }>> {
  const existing = await prisma.booking.findUnique({ where: { id: p.bookingId } });
  if (!existing) return { ok: false, error: "not_found" };
  if (p.by === "client" && existing.clientId !== p.clientId) return { ok: false, error: "forbidden" };
  if (existing.status !== "CONFIRMED") return { ok: false, error: "already_cancelled" };

  return prisma.$transaction(async (tx) => {
    await lockMaster(tx, existing.masterId);
    const current = await tx.booking.findUnique({ where: { id: p.bookingId } });
    if (!current || current.status !== "CONFIRMED") return { ok: false, error: "already_cancelled" } as const;
    const durationMin = current.durationMinAtBooking;
    const err = await validateTime(tx, {
      masterId: current.masterId,
      date: p.date,
      startMin: p.startMin,
      durationMin,
      by: p.by,
      excludeBookingId: current.id,
    });
    if (err) return { ok: false, error: err } as const;
    const startAt = salonToUtc(p.date, p.startMin);
    await tx.booking.update({
      where: { id: current.id },
      data: { startAt, endAt: new Date(startAt.getTime() + durationMin * 60_000) },
    });
    return { ok: true, value: { id: current.id } } as const;
  });
}

/** Отмена: слот снова становится доступен (US-11). */
export async function cancelBooking(p: {
  bookingId: number;
  by: "client" | "admin";
  clientId?: number;
}): Promise<Result<{ id: number }>> {
  const b = await prisma.booking.findUnique({ where: { id: p.bookingId } });
  if (!b) return { ok: false, error: "not_found" };
  if (p.by === "client" && b.clientId !== p.clientId) return { ok: false, error: "forbidden" };
  if (b.status !== "CONFIRMED") return { ok: false, error: "already_cancelled" };
  await prisma.booking.update({
    where: { id: b.id },
    data: { status: "CANCELLED", cancelledBy: p.by },
  });
  return { ok: true, value: { id: b.id } };
}
