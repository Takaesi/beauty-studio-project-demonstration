import Link from "next/link";
import { FormAlert } from "@/components/field";
import { FillFromTemplateForm, ScheduleCalendar, WeeklyTemplateForm, type CalendarDay } from "@/components/admin/schedule";
import { prisma } from "@/lib/db";
import { addDays, dateStrToDb, dbToDateStr, formatDayMonth, isDateStr, salonToUtc, todaySalon, toSalonParts, weekdayOf } from "@/lib/time";

export const metadata = { title: "График мастеров" };

const WEEKS = 5;

/** US-12, US-13: создание и изменение графика работы мастеров */
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ masterId?: string; start?: string; new?: string }>;
}) {
  const sp = await searchParams;
  const masters = await prisma.master.findMany({ orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { id: "asc" }] });
  if (!masters.length) {
    return (
      <div>
        <h1 className="display text-[44px]">График</h1>
        <p className="mt-4 text-muted">Сначала <Link href="/admin/masters/new" className="underline">добавьте мастера</Link>.</p>
      </div>
    );
  }
  const master = masters.find((m) => m.id === Number(sp.masterId)) ?? masters[0];
  const today = todaySalon();
  const base = isDateStr(sp.start) ? sp.start : today;
  const monday = addDays(base, -(weekdayOf(base) - 1));
  const last = addDays(monday, WEEKS * 7 - 1);

  const [template, workDays, bookings] = await Promise.all([
    prisma.weeklyTemplate.findMany({ where: { masterId: master.id }, orderBy: { weekday: "asc" } }),
    prisma.workDay.findMany({ where: { masterId: master.id, workDate: { gte: dateStrToDb(monday), lte: dateStrToDb(last) } } }),
    prisma.booking.findMany({
      where: { masterId: master.id, status: "CONFIRMED", startAt: { gte: salonToUtc(monday, 0), lt: salonToUtc(addDays(last, 1), 0) } },
      select: { startAt: true },
    }),
  ]);
  const wdMap = new Map(workDays.map((w) => [dbToDateStr(w.workDate), w]));
  const counts = new Map<string, number>();
  for (const b of bookings) {
    const d = toSalonParts(b.startAt).date;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  const days: CalendarDay[] = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const date = addDays(monday, i);
    const w = wdMap.get(date);
    return {
      date,
      work: w ? { startMin: w.startMin, endMin: w.endMin } : null,
      bookings: counts.get(date) ?? 0,
      isPast: date < today,
      isToday: date === today,
    };
  });
  const q = (start: string) => `/admin/schedule?masterId=${master.id}&start=${start}`;

  return (
    <div>
      <h1 className="display text-[44px] md:text-[56px]">График</h1>
      {sp.new && <div className="mt-4"><FormAlert tone="success">Мастер добавлен. Задайте шаблон недели и заполните график, чтобы клиенты могли записываться.</FormAlert></div>}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {masters.map((m) => (
          <Link
            key={m.id}
            href={`/admin/schedule?masterId=${m.id}&start=${monday}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-[13px] transition-colors ${
              m.id === master.id ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"
            } ${m.isActive ? "" : "opacity-60"}`}
          >
            {m.name}{!m.isActive && " (скрыт)"}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-10 xl:grid-cols-[1fr_340px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] text-muted">
              {formatDayMonth(monday)} — {formatDayMonth(last)} · нажмите на день, чтобы изменить часы
            </p>
            <div className="flex gap-2">
              <Link href={q(addDays(monday, -WEEKS * 7))} className="btn btn-outline btn-sm" aria-label="Раньше">←</Link>
              <Link href={q(today)} className="btn btn-outline btn-sm">Сейчас</Link>
              <Link href={q(addDays(monday, WEEKS * 7))} className="btn btn-outline btn-sm" aria-label="Позже">→</Link>
            </div>
          </div>
          <ScheduleCalendar key={`${master.id}-${monday}`} masterId={master.id} days={days} />
        </section>

        <aside className="flex flex-col gap-6">
          <div className="card p-6">
            <p className="eyebrow">Шаблон недели</p>
            <p className="mt-2 mb-5 text-[13px] text-muted">Обычные рабочие часы мастера. Из шаблона заполняется график на период.</p>
            <WeeklyTemplateForm key={master.id} masterId={master.id} template={template} />
          </div>
          <div className="card p-6">
            <p className="eyebrow mb-5">Заполнить по шаблону</p>
            <FillFromTemplateForm key={master.id} masterId={master.id} from={today} to={addDays(today, 27)} />
          </div>
        </aside>
      </div>
    </div>
  );
}
