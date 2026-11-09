// AC-03.3: телефон в формате +7 и 10 цифр.
export const PHONE_FORMAT_HINT = "Введите номер в формате +7 900 123-45-67";

/** Возвращает +7XXXXXXXXXX или null, если номер не соответствует формату. */
export function normalizePhone(input: string): string | null {
  const s = input.replace(/[\s\-()]/g, "");
  return /^\+7\d{10}$/.test(s) ? s : null;
}

/** +79001234567 → +7 900 123-45-67 */
export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "").slice(1);
  if (d.length !== 10) return p;
  return `+7 ${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8)}`;
}
