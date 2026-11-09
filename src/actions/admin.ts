"use server";

import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginAdmin, logoutAdmin, requireAdmin } from "@/lib/auth";
import { BOOKING_ERROR_TEXT, cancelBooking, createBooking, rescheduleBooking } from "@/lib/booking";
import { prisma } from "@/lib/db";
import { normalizePhone, PHONE_FORMAT_HINT } from "@/lib/phone";
import { addDays, dateStrToDb, hhmmToMin, isDateStr, salonToUtc, toSalonParts, weekdayOf, type DateStr } from "@/lib/time";

const REQUIRED = "Заполните обязательное поле";

// ——— вход ———

export async function adminLoginAction(_: { error?: string }, fd: FormData): Promise<{ error?: string }> {
  const ok = await loginAdmin(String(fd.get("login") ?? ""), String(fd.get("password") ?? ""));
  if (!ok) return { error: "Неверный логин или пароль" };
  redirect("/admin");
}

export async function adminLogoutAction() {
  await logoutAdmin();
  redirect("/admin/login");
}

// ——— день мастера (подсказка в формах записи/переноса) ———

export type DayInfo = {
  workDay: { startMin: number; endMin: number } | null;
  bookings: { id: number; startMin: number; endMin: number; service: string; client: string }[];
};

export async function adminDayInfoAction(masterId: number, date: string): Promise<DayInfo> {
  await requireAdmin();
  if (!isDateStr(date) || !Number.isInteger(masterId)) return { workDay: null, bookings: [] };
  const [workDay, bookings] = await Promise.all([
    prisma.workDay.findUnique({ where: { masterId_workDate: { masterId, workDate: dateStrToDb(date) } } }),
    prisma.booking.findMany({
      where: {
        masterId,
        status: "CONFIRMED",
        startAt: { gte: salonToUtc(date, 0), lt: salonToUtc(addDays(date, 1), 0) },
      },
      include: { service: true },
      orderBy: { startAt: "asc" },
    }),
  ]);
  return {
    workDay: workDay ? { startMin: workDay.startMin, endMin: workDay.endMin } : null,
    bookings: bookings.map((b) => {
      const s = toSalonParts(b.startAt).minutes;
      return { id: b.id, startMin: s, endMin: s + b.durationMinAtBooking, service: b.service.name, client: b.contactName };
    }),
  };
}

// ——— записи ———

export type AdminBookingState = {
  errors?: Partial<Record<"phone" | "name" | "serviceId" | "masterId" | "date" | "time" | "form", string>>;
};

/** US-09: запись, сделанная по телефону */
export async function adminCreateBookingAction(_: AdminBookingState, fd: FormData): Promise<AdminBookingState> {
  await requireAdmin();
  const phoneRaw = String(fd.get("phone") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const serviceId = Number(fd.get("serviceId"));
  const masterId = Number(fd.get("masterId"));
  const date = String(fd.get("date") ?? "");
  const startMin = hhmmToMin(String(fd.get("time") ?? ""));
  const errors: AdminBookingState["errors"] = {};
  const phone = normalizePhone(phoneRaw);
  if (!phoneRaw || phoneRaw === "+7") errors.phone = REQUIRED;
  else if (!phone) errors.phone = PHONE_FORMAT_HINT;
  if (!name) errors.name = REQUIRED;
  if (!serviceId) errors.serviceId = "Выберите услугу";
  if (!masterId) errors.masterId = "Выберите мастера";
  if (!isDateStr(date)) errors.date = "Укажите дату";
  if (startMin === null) errors.time = "Укажите время";
  if (Object.keys(errors).length) return { errors };

  const client =
    (await prisma.client.findUnique({ where: { phone: phone! } })) ??
    (await prisma.client.create({ data: { phone: phone!, name } }));

  const res = await createBooking({
    clientId: client.id,
    serviceId,
    masterId,
    date,
    startMin: startMin!,
    contactName: name,
    contactPhone: phone!,
    by: "admin",
  });
  if (!res.ok) return { errors: { form: BOOKING_ERROR_TEXT[res.error] } };
  revalidatePath("/admin");
  redirect(`/admin/bookings/${res.value.id}?created=1`);
}

/** US-10 / AC-10.1–10.2 */
export async function adminRescheduleAction(_: AdminBookingState, fd: FormData): Promise<AdminBookingState> {
  await requireAdmin();
  const bookingId = Number(fd.get("bookingId"));
  const date = String(fd.get("date") ?? "");
  const startMin = hhmmToMin(String(fd.get("time") ?? ""));
  if (!isDateStr(date)) return { errors: { date: "Укажите дату" } };
  if (startMin === null) return { errors: { time: "Укажите время" } };
  const res = await rescheduleBooking({ bookingId, date, startMin, by: "admin" });
  if (!res.ok) return { errors: { form: BOOKING_ERROR_TEXT[res.error] } };
  revalidatePath("/admin");
  redirect(`/admin/bookings/${bookingId}?moved=1`);
}

/** US-11 */
export async function adminCancelAction(bookingId: number) {
  await requireAdmin();
  const res = await cancelBooking({ bookingId, by: "admin" });
  revalidatePath("/admin");
  return res.ok ? { ok: true as const } : { ok: false as const, error: BOOKING_ERROR_TEXT[res.error] };
}

// ——— услуги (US-15..17) ———

export type FormState = { errors?: Record<string, string>; ok?: boolean };

export async function saveServiceAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const name = String(fd.get("name") ?? "").trim();
  const category = String(fd.get("category") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const price = Number(String(fd.get("price") ?? "").replace(",", ".").replace(/\s/g, ""));
  const durationMin = Number(fd.get("durationMin"));
  const isActive = fd.get("isActive") === "on";
  const masterIds = fd.getAll("masterIds").map(Number).filter(Boolean);

  const errors: Record<string, string> = {};
  if (!name) errors.name = REQUIRED;
  if (!Number.isFinite(price) || price <= 0) errors.price = "Укажите цену больше 0";
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 720)
    errors.durationMin = "Длительность — целое число минут от 5 до 720";
  if (Object.keys(errors).length) return { errors };

  const data = { name, category, description, price, durationMin, isActive };
  const service = id
    ? await prisma.service.update({ where: { id }, data })
    : await prisma.service.create({ data: { ...data, sortOrder: await nextSort("service") } });

  await prisma.$transaction([
    prisma.masterService.deleteMany({ where: { serviceId: service.id, masterId: { notIn: masterIds } } }),
    prisma.masterService.createMany({
      data: masterIds.map((masterId) => ({ masterId, serviceId: service.id })),
      skipDuplicates: true,
    }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/services?saved=1");
}

export async function toggleServiceAction(id: number) {
  await requireAdmin();
  const s = await prisma.service.findUnique({ where: { id } });
  if (s) await prisma.service.update({ where: { id }, data: { isActive: !s.isActive } });
  revalidatePath("/", "layout");
}

async function nextSort(kind: "service" | "master") {
  const agg =
    kind === "service"
      ? await prisma.service.aggregate({ _max: { sortOrder: true } })
      : await prisma.master.aggregate({ _max: { sortOrder: true } });
  return (agg._max.sortOrder ?? 0) + 1;
}

// ——— мастера ———

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

async function savePhoto(file: File): Promise<string | { error: string }> {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "Фото должно быть в формате JPG, PNG или WebP" };
  if (file.size > 5 * 1024 * 1024) return { error: "Фото больше 5 МБ" };
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(12).toString("hex")}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${name}`;
}

export async function saveMasterAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const name = String(fd.get("name") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  const bio = String(fd.get("bio") ?? "").trim();
  const isActive = fd.get("isActive") === "on";
  const serviceIds = fd.getAll("serviceIds").map(Number).filter(Boolean);
  const photo = fd.get("photo");
  const removePhoto = fd.get("removePhoto") === "on";

  const errors: Record<string, string> = {};
  if (!name) errors.name = REQUIRED;

  let photoUrl: string | null | undefined = undefined;
  if (photo instanceof File && photo.size > 0) {
    const saved = await savePhoto(photo);
    if (typeof saved === "string") photoUrl = saved;
    else errors.photo = saved.error;
  } else if (removePhoto) {
    photoUrl = null;
  }
  if (Object.keys(errors).length) return { errors };

  const data = { name, title, bio, isActive, ...(photoUrl !== undefined ? { photoUrl } : {}) };
  const master = id
    ? await prisma.master.update({ where: { id }, data })
    : await prisma.master.create({ data: { ...data, sortOrder: await nextSort("master") } });

  await prisma.$transaction([
    prisma.masterService.deleteMany({ where: { masterId: master.id, serviceId: { notIn: serviceIds } } }),
    prisma.masterService.createMany({
      data: serviceIds.map((serviceId) => ({ masterId: master.id, serviceId })),
      skipDuplicates: true,
    }),
  ]);
  revalidatePath("/", "layout");
  redirect(id ? "/admin/masters?saved=1" : `/admin/schedule?masterId=${master.id}&new=1`);
}

export async function toggleMasterAction(id: number) {
  await requireAdmin();
  const m = await prisma.master.findUnique({ where: { id } });
  if (m) await prisma.master.update({ where: { id }, data: { isActive: !m.isActive } });
  revalidatePath("/", "layout");
}

// ——— график мастеров (US-12, US-13) ———

async function conflictsForHours(masterId: number, date: DateStr, startMin: number | null, endMin: number | null) {
  const bookings = await prisma.booking.findMany({
    where: { masterId, status: "CONFIRMED", startAt: { gte: salonToUtc(date, 0), lt: salonToUtc(addDays(date, 1), 0) } },
  });
  return bookings.filter((b) => {
    if (startMin === null || endMin === null) return true; // выходной — мешает любая запись
    const s = toSalonParts(b.startAt).minutes;
    return s < startMin || s + b.durationMinAtBooking > endMin;
  });
}

export async function saveWorkDayAction(input: {
  masterId: number;
  date: string;
  start: string | null; // null — выходной
  end: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isDateStr(input.date)) return { ok: false, error: "Некорректная дата" };
  const off = input.start === null;
  const s = off ? null : hhmmToMin(input.start!);
  const e = off ? null : hhmmToMin(input.end ?? "");
  if (!off && (s === null || e === null || s >= e)) return { ok: false, error: "Начало должно быть раньше окончания" };

  const conflicts = await conflictsForHours(input.masterId, input.date, s, e);
  if (conflicts.length) {
    return {
      ok: false,
      error: `В этот день есть записи вне нового графика (${conflicts.length}). Сначала перенесите или отмените их.`,
    };
  }
  const where = { masterId_workDate: { masterId: input.masterId, workDate: dateStrToDb(input.date) } };
  if (off) await prisma.workDay.deleteMany({ where: { masterId: input.masterId, workDate: dateStrToDb(input.date) } });
  else
    await prisma.workDay.upsert({
      where,
      create: { masterId: input.masterId, workDate: dateStrToDb(input.date), startMin: s!, endMin: e! },
      update: { startMin: s!, endMin: e! },
    });
  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function saveWeeklyTemplateAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const masterId = Number(fd.get("masterId"));
  const rows: { weekday: number; startMin: number; endMin: number }[] = [];
  const errors: Record<string, string> = {};
  for (let wd = 1; wd <= 7; wd++) {
    if (fd.get(`on${wd}`) !== "on") continue;
    const s = hhmmToMin(String(fd.get(`start${wd}`) ?? ""));
    const e = hhmmToMin(String(fd.get(`end${wd}`) ?? ""));
    if (s === null || e === null || s >= e) errors[`d${wd}`] = "Проверьте время";
    else rows.push({ weekday: wd, startMin: s, endMin: e });
  }
  if (Object.keys(errors).length) return { errors };
  await prisma.$transaction([
    prisma.weeklyTemplate.deleteMany({ where: { masterId } }),
    prisma.weeklyTemplate.createMany({ data: rows.map((r) => ({ ...r, masterId })) }),
  ]);
  revalidatePath("/admin/schedule");
  return { ok: true };
}

export type FillResult = { ok?: string; error?: string };

/** Заполнить график на период по шаблону недели. Дни с записями, которые не помещаются в новый график, пропускаются. */
export async function fillFromTemplateAction(_: FillResult, fd: FormData): Promise<FillResult> {
  await requireAdmin();
  const masterId = Number(fd.get("masterId"));
  const from = String(fd.get("from") ?? "");
  const to = String(fd.get("to") ?? "");
  const overwrite = fd.get("overwrite") === "on";
  if (!isDateStr(from) || !isDateStr(to) || from > to) return { error: "Укажите корректный период" };
  if (addDays(from, 92) < to) return { error: "Период — не больше 3 месяцев" };

  const template = await prisma.weeklyTemplate.findMany({ where: { masterId } });
  if (!template.length) return { error: "Сначала сохраните шаблон недели" };
  const byWd = new Map(template.map((t) => [t.weekday, t]));
  const existing = new Map(
    (
      await prisma.workDay.findMany({ where: { masterId, workDate: { gte: dateStrToDb(from), lte: dateStrToDb(to) } } })
    ).map((w) => [w.workDate.toISOString().slice(0, 10), w]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const t = byWd.get(weekdayOf(d));
    const ex = existing.get(d);
    if (ex && !overwrite) continue;
    if (!t && !ex) continue;
    const conflicts = await conflictsForHours(masterId, d, t?.startMin ?? null, t?.endMin ?? null);
    if (conflicts.length) {
      skipped++;
      continue;
    }
    if (!t) {
      await prisma.workDay.delete({ where: { id: ex!.id } });
      updated++;
    } else if (ex) {
      await prisma.workDay.update({ where: { id: ex.id }, data: { startMin: t.startMin, endMin: t.endMin } });
      updated++;
    } else {
      await prisma.workDay.create({ data: { masterId, workDate: dateStrToDb(d), startMin: t.startMin, endMin: t.endMin } });
      created++;
    }
  }
  revalidatePath("/admin/schedule");
  const parts = [`добавлено дней: ${created}`, `изменено: ${updated}`];
  if (skipped) parts.push(`пропущено из-за записей: ${skipped}`);
  return { ok: `График заполнен — ${parts.join(", ")}` };
}

/** Подсказка имени по телефону при записи по звонку */
export async function adminFindClientAction(phoneRaw: string): Promise<{ name: string } | null> {
  await requireAdmin();
  const phone = normalizePhone(phoneRaw);
  if (!phone) return null;
  const c = await prisma.client.findUnique({ where: { phone } });
  return c ? { name: c.name } : null;
}
