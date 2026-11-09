"use server";

import { revalidatePath } from "next/cache";
import { getCurrentClient } from "@/lib/auth";
import {
  BOOKING_ERROR_TEXT,
  cancelBooking,
  createBooking,
  getBookableOffer,
  getClientSlots,
  rescheduleBooking,
} from "@/lib/booking";
import { prisma } from "@/lib/db";
import { normalizePhone, PHONE_FORMAT_HINT } from "@/lib/phone";
import type { DaySlots } from "@/lib/slots";
import { isDateStr } from "@/lib/time";

const REQUIRED = "Заполните обязательное поле";

export async function refreshSlotsAction(serviceId: number, masterId: number, excludeBookingId?: number): Promise<DaySlots[]> {
  const client = await getCurrentClient();
  if (!client) return [];
  let durationMin: number;
  if (excludeBookingId) {
    const b = await prisma.booking.findUnique({ where: { id: excludeBookingId } });
    if (!b || b.clientId !== client.id) return [];
    durationMin = b.durationMinAtBooking;
  } else {
    const offer = await getBookableOffer(serviceId, masterId);
    if (!offer) return [];
    durationMin = offer.service.durationMin;
  }
  return getClientSlots({ serviceId, masterId, durationMin, excludeBookingId });
}

export type CreateBookingResult =
  | { ok: true; id: number }
  | {
      ok: false;
      fieldErrors?: Partial<Record<"name" | "phone" | "consent", string>>;
      error?: string;
      slotTaken?: boolean;
      slots?: DaySlots[];
    };

export async function createBookingAction(input: {
  serviceId: number;
  masterId: number;
  date: string;
  startMin: number;
  name: string;
  phone: string;
  consent: boolean;
}): Promise<CreateBookingResult> {
  const client = await getCurrentClient();
  if (!client) return { ok: false, error: "Сессия истекла. Войдите снова" };

  // AC-03.2, AC-03.3, NFR-03
  const fieldErrors: Partial<Record<"name" | "phone" | "consent", string>> = {};
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (!name) fieldErrors.name = REQUIRED;
  if (!input.phone.trim() || input.phone.trim() === "+7") fieldErrors.phone = REQUIRED;
  else if (!phone) fieldErrors.phone = PHONE_FORMAT_HINT;
  if (!input.consent) fieldErrors.consent = "Нужно согласие на обработку персональных данных";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors };
  if (!isDateStr(input.date) || !Number.isInteger(input.startMin)) return { ok: false, error: "Некорректное время" };

  const res = await createBooking({
    clientId: client.id,
    serviceId: input.serviceId,
    masterId: input.masterId,
    date: input.date,
    startMin: input.startMin,
    contactName: name,
    contactPhone: phone!,
    by: "client",
  });

  if (!res.ok) {
    if (res.error === "slot_taken") {
      // AC-03.4: возвращаем свежие слоты, чтобы клиент сразу выбрал другое время
      const slots = await refreshSlotsAction(input.serviceId, input.masterId);
      return { ok: false, slotTaken: true, error: BOOKING_ERROR_TEXT.slot_taken, slots };
    }
    return { ok: false, error: BOOKING_ERROR_TEXT[res.error] };
  }
  revalidatePath("/account");
  return { ok: true, id: res.value.id };
}

export async function rescheduleBookingAction(input: { bookingId: number; date: string; startMin: number }) {
  const client = await getCurrentClient();
  if (!client) return { ok: false as const, error: "Сессия истекла. Войдите снова" };
  if (!isDateStr(input.date)) return { ok: false as const, error: "Некорректная дата" };
  const res = await rescheduleBooking({ ...input, by: "client", clientId: client.id });
  if (!res.ok) return { ok: false as const, error: BOOKING_ERROR_TEXT[res.error], slotTaken: res.error === "slot_taken" };
  revalidatePath("/account");
  return { ok: true as const };
}

export async function cancelBookingAction(bookingId: number) {
  const client = await getCurrentClient();
  if (!client) return { ok: false as const, error: "Сессия истекла. Войдите снова" };
  const res = await cancelBooking({ bookingId, by: "client", clientId: client.id });
  if (!res.ok) return { ok: false as const, error: BOOKING_ERROR_TEXT[res.error] };
  revalidatePath("/account");
  return { ok: true as const };
}
