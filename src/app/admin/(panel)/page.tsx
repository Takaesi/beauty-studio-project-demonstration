import Link from "next/link";
import { DatePicker } from "@/components/admin/date-picker";
import { prisma } from "@/lib/db";
import { formatPhone } from "@/lib/phone";
import {
  addDays,
  dateStrToDb,
  formatDayMonth,
  formatPrice,
  isDateStr,
  minToHHMM,
  salonToUtc,
  todaySalon,
  toSalonParts,
  weekdayFull,
} from "@/lib/time";

export const metadata = { title: "Записи" };

const PX_PER_MIN = 1.3;

/** US-08: записи на день по каждому мастеру */
export default async function AdminDayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const today = todaySalon();
  const date = isDateStr(sp.date) ? sp.date : today;

  const [bookings, workDays, activeMasters] = await Promise.all([
    prisma.booking.findMany({
      where: { startAt: { gte: salonToUtc(date, 0), lt: salonToUtc(addDays(date, 1), 0) } },
      include: { service: true, client: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.workDay.findMany({ where: { workDate: dateStrToDb(date) } }),
    prisma.master.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);

  // Показываем и скрытых мастеров, если у них есть записи на этот день
  const extraIds = [...new Set(bookings.map((b) => b.masterId))].filter((id) => !activeMasters.some((m) => m.id === id));
  const masters = extraIds.length
    ? [...activeMasters, ...(await prisma.master.findMany({ where: { id: { in: extraIds } } }))]
    : activeMasters;

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  const wdByMaster = new Map(workDays.map((w) => [w.masterId, w]));

  const items = confirmed.map((b) => {
    const s = toSalonParts(b.startAt).minutes;
    return { ...b, s, e: s + b.durationMinAtBooking };
  });
  const rangeStart = Math.min(9 * 60, ...workDays.map((w) => w.startMin), ...items.map((i) => i.s));
  const rangeEnd = Math.max(21 * 60, ...workDays.map((w) => w.endMin), ...items.map((i) => i.e));
  const startHour = Math.floor(rangeStart / 60);
  const endHour = Math.ceil(rangeEnd / 60);
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const top = (m: number) => (m - startHour * 60) * PX_PER_MIN;
  const height = (endHour - startHour) * 60 * PX_PER_MIN;
  const revenue = confirmed.reduce((sum, b) => sum + Number(b.priceAtBooking), 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{date === today ? "Сегодня" : weekdayFull(date)}</p>
          <h1 className="display mt-2 text-[44px] md:text-[56px]">{formatDayMonth(date)}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/admin?date=${addDays(date, -1)}`} className="btn btn-outline btn-sm" aria-label="Предыдущий день">←</Link>
          <DatePicker value={date} />
          <Link href={`/admin?date=${addDays(date, 1)}`} className="btn btn-outline btn-sm" aria-label="Следующий день">→</Link>
          {date !== today && <Link href="/admin" className="btn btn-sm text-muted hover:text-ink">Сегодня</Link>}
          <Link href={`/admin/bookings/new?date=${date}`} className="btn btn-primary btn-sm">+ Запись</Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-muted">
        <span>Записей: <b className="text-ink">{confirmed.length}</b></span>
        <span>Сумма по записям: <b className="text-ink">{formatPrice(revenue)}</b></span>
        {cancelled.length > 0 && <span>Отменено: {cancelled.length}</span>}
      </div>

      {/* Таймлайн: колонка на каждого мастера */}
      <div className="mt-8 overflow-x-auto border border-line bg-paper">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `56px repeat(${masters.length}, minmax(190px, 1fr))` }}>
          <div className="sticky left-0 z-20 border-b border-line bg-paper" />
          {masters.map((m) => {
            const wd = wdByMaster.get(m.id);
            const count = items.filter((i) => i.masterId === m.id).length;
            return (
              <div key={m.id} className="border-b border-l border-line px-4 py-3">
                <div className="font-medium">{m.name}{!m.isActive && <span className="ml-2 text-[11px] text-muted">(скрыт)</span>}</div>
                <div className="text-[12px] text-muted">
                  {wd ? `${minToHHMM(wd.startMin)}–${minToHHMM(wd.endMin)}` : "выходной"} · {count} зап.
                </div>
              </div>
            );
          })}

          <div className="sticky left-0 z-10 bg-paper" style={{ height }}>
            {hours.map((h) => (
              <div key={h} className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-muted" style={{ top: top(h * 60) }}>
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>
          {masters.map((m) => {
            const wd = wdByMaster.get(m.id);
            return (
              <div key={m.id} className="relative border-l border-line bg-[repeating-linear-gradient(135deg,transparent_0_8px,rgba(119,110,100,0.07)_8px_9px)]" style={{ height }}>
                {wd && (
                  <div className="absolute inset-x-0 bg-paper" style={{ top: top(wd.startMin), height: (wd.endMin - wd.startMin) * PX_PER_MIN }} />
                )}
                {hours.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line/60" style={{ top: top(h * 60) }} />
                ))}
                {items
                  .filter((i) => i.masterId === m.id)
                  .map((b) => (
                    <Link
                      key={b.id}
                      href={`/admin/bookings/${b.id}`}
                      className="absolute inset-x-1.5 overflow-hidden border-l-2 border-accent bg-sand px-2.5 py-1.5 text-[12px] leading-tight transition-colors hover:bg-[#e2d6c5]"
                      style={{ top: top(b.s) + 1, height: (b.e - b.s) * PX_PER_MIN - 2 }}
                    >
                      <div className="font-semibold tabular-nums">{minToHHMM(b.s)}–{minToHHMM(b.e)}</div>
                      <div className="truncate">{b.service.name}</div>
                      <div className="truncate text-ink-soft">{b.contactName}</div>
                      <div className="truncate tabular-nums text-muted">{formatPhone(b.contactPhone)}</div>
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Список — удобнее на телефоне и для звонков (US-14) */}
      <h2 className="display mt-14 text-[30px]">Список записей</h2>
      {bookings.length === 0 ? (
        <p className="mt-4 text-muted">На этот день записей нет.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr className="border-b border-line">
                <th className="py-3 pr-4 font-medium">Время</th>
                <th className="py-3 pr-4 font-medium">Мастер</th>
                <th className="py-3 pr-4 font-medium">Услуга</th>
                <th className="py-3 pr-4 font-medium">Клиент</th>
                <th className="py-3 pr-4 font-medium">Телефон</th>
                <th className="py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const s = toSalonParts(b.startAt).minutes;
                return (
                  <tr key={b.id} className={`border-b border-line/70 ${b.status === "CANCELLED" ? "text-muted line-through decoration-muted/40" : ""}`}>
                    <td className="py-3 pr-4 tabular-nums">
                      <Link href={`/admin/bookings/${b.id}`} className="underline-offset-4 hover:underline">
                        {minToHHMM(s)}–{minToHHMM(s + b.durationMinAtBooking)}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{masters.find((m) => m.id === b.masterId)?.name}</td>
                    <td className="py-3 pr-4">{b.service.name}</td>
                    <td className="py-3 pr-4">{b.contactName}</td>
                    <td className="py-3 pr-4 tabular-nums">
                      <a href={`tel:${b.contactPhone}`} className="hover:text-accent">{formatPhone(b.contactPhone)}</a>
                    </td>
                    <td className="py-3 no-underline">{b.status === "CONFIRMED" ? "Подтверждена" : "Отменена"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
