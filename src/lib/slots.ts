// Чистая логика расчёта свободного времени (без БД) — покрыта тестами в slots.test.ts.
import { addDays, salonToUtc, type DateStr } from "./time";

export const BOOKING_HORIZON_DAYS = 14; // AC-02.2: расписание на 14 дней вперёд
export const SLOT_STEP_MIN = 30; // AC-02.2: шаг 30 минут
export const MIN_LEAD_MIN = 120; // AC-02.2: не показываем время, до которого < 2 часов

export type WorkDayLite = { date: DateStr; startMin: number; endMin: number };
export type Interval = { start: Date; end: Date };
export type DaySlots = { date: DateStr; slots: number[] };

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) =>
  aStart < bEnd && bStart < aEnd;

/**
 * Свободные слоты мастера на горизонт записи.
 * Слот подходит, если услуга целиком помещается в рабочий день,
 * не пересекается с подтверждёнными записями и начинается не раньше чем через 2 часа.
 */
export function computeFreeSlots(params: {
  workDays: WorkDayLite[];
  busy: Interval[];
  durationMin: number;
  now: Date;
  fromDate: DateStr;
  days?: number;
  stepMin?: number;
  minLeadMin?: number;
}): DaySlots[] {
  const {
    workDays,
    busy,
    durationMin,
    now,
    fromDate,
    days = BOOKING_HORIZON_DAYS,
    stepMin = SLOT_STEP_MIN,
    minLeadMin = MIN_LEAD_MIN,
  } = params;

  const byDate = new Map(workDays.map((w) => [w.date, w]));
  const earliest = now.getTime() + minLeadMin * 60_000;
  const busyMs = busy.map((b) => [b.start.getTime(), b.end.getTime()] as const);
  const result: DaySlots[] = [];

  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const wd = byDate.get(date);
    const slots: number[] = [];
    if (wd) {
      for (let m = wd.startMin; m + durationMin <= wd.endMin; m += stepMin) {
        const start = salonToUtc(date, m).getTime();
        const end = start + durationMin * 60_000;
        if (start < earliest) continue;
        if (busyMs.some(([bs, be]) => overlaps(start, end, bs, be))) continue;
        slots.push(m);
      }
    }
    result.push({ date, slots });
  }
  return result;
}

export type FitResult = "ok" | "no_workday" | "outside_hours" | "overlap";

/** Проверка конкретного времени (запись администратором и перенос, AC-10.1/10.2). */
export function checkFits(params: {
  workDay: WorkDayLite | null;
  busy: Interval[];
  date: DateStr;
  startMin: number;
  durationMin: number;
}): FitResult {
  const { workDay, busy, date, startMin, durationMin } = params;
  if (!workDay) return "no_workday";
  if (startMin < workDay.startMin || startMin + durationMin > workDay.endMin) return "outside_hours";
  const start = salonToUtc(date, startMin).getTime();
  const end = start + durationMin * 60_000;
  if (busy.some((b) => overlaps(start, end, b.start.getTime(), b.end.getTime()))) return "overlap";
  return "ok";
}
