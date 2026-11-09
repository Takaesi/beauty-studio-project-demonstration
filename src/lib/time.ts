// Работа с датой/временем салона.
// Салон живёт по московскому времени (UTC+3, без перехода на летнее время),
// поэтому достаточно фиксированного смещения — сервер при этом может быть в любом часовом поясе.

export const SALON_OFFSET_MIN = Number(process.env.SALON_UTC_OFFSET_MIN ?? 180);

/** Дата салона в формате YYYY-MM-DD */
export type DateStr = string;

const pad = (n: number) => String(n).padStart(2, "0");

/** Календарная дата и минуты от полуночи по времени салона для момента времени. */
export function toSalonParts(d: Date): { date: DateStr; minutes: number } {
  const shifted = new Date(d.getTime() + SALON_OFFSET_MIN * 60_000);
  const date = `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
  return { date, minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

/** Момент времени (UTC) по дате и минутам салона. */
export function salonToUtc(date: DateStr, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, minutes) - SALON_OFFSET_MIN * 60_000);
}

export function todaySalon(now = new Date()): DateStr {
  return toSalonParts(now).date;
}

export function addDays(date: DateStr, n: number): DateStr {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** 1 = понедельник … 7 = воскресенье */
export function weekdayOf(date: DateStr): number {
  const [y, m, d] = date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return wd === 0 ? 7 : wd;
}

/** Значение для колонки @db.Date */
export function dateStrToDb(date: DateStr): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function dbToDateStr(d: Date): DateStr {
  return d.toISOString().slice(0, 10);
}

export function isDateStr(s: unknown): s is DateStr {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

// ——— форматирование ———

export function minToHHMM(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function hhmmToMin(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mm = Number(m[2]);
  if (h > 24 || mm > 59 || (h === 24 && mm > 0)) return null;
  return h * 60 + mm;
}

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS_SHORT = ["", "пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEKDAYS_FULL = ["", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];

/** «15 ноября» */
export function formatDayMonth(date: DateStr): string {
  const [, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS_GEN[m - 1]}`;
}

export function weekdayShort(date: DateStr): string {
  return WEEKDAYS_SHORT[weekdayOf(date)];
}

export function weekdayFull(date: DateStr): string {
  return WEEKDAYS_FULL[weekdayOf(date)];
}

export const WEEKDAY_NAMES = WEEKDAYS_FULL.slice(1);

/** «15 ноября в 14:00» для момента времени */
export function formatMoment(d: Date): string {
  const p = toSalonParts(d);
  return `${formatDayMonth(p.date)} в ${minToHHMM(p.minutes)}`;
}

export function formatPrice(v: number | string | { toString(): string }): string {
  const n = Number(v.toString());
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)} ₽`;
}

/** AC-01.1: длительность показывается в минутах */
export function formatDuration(min: number): string {
  return `${min} мин`;
}
