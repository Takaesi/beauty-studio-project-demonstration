"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cancelBookingAction, refreshSlotsAction, rescheduleBookingAction } from "@/actions/booking";
import type { DaySlots } from "@/lib/slots";
import { formatDayMonth, minToHHMM } from "@/lib/time";
import { FormAlert } from "./field";
import { SlotPicker, type SlotSelection } from "./slot-picker";

/** Кнопки «Перенести» / «Отменить» с подтверждением прямо на странице. */
export function ClientBookingActions({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[14px]">Отменить запись? Время освободится для других гостей.</p>
        {error && <FormAlert>{error}</FormAlert>}
        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-danger btn-sm"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await cancelBookingAction(bookingId);
                if (!res.ok) setError(res.error);
                else {
                  setConfirming(false);
                  router.refresh();
                }
              })
            }
          >
            {pending ? "Отменяем…" : "Да, отменить"}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setConfirming(false)}>
            Оставить
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Link href={`/account/bookings/${bookingId}/reschedule`} className="btn btn-outline btn-sm">
        Перенести
      </Link>
      <button className="btn btn-sm text-muted hover:text-danger" onClick={() => setConfirming(true)}>
        Отменить
      </button>
    </div>
  );
}

export function RescheduleFlow({
  bookingId,
  serviceId,
  masterId,
  initialDays,
}: {
  bookingId: number;
  serviceId: number;
  masterId: number;
  initialDays: DaySlots[];
}) {
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [activeDate, setActiveDate] = useState<string | null>(initialDays.find((d) => d.slots.length)?.date ?? null);
  const [selected, setSelected] = useState<SlotSelection>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const hasAny = days.some((d) => d.slots.length);

  if (!hasAny) {
    return (
      <div className="border-y border-line py-14 text-center">
        <p className="display text-[28px]">В ближайшие 14 дней у мастера нет свободного времени</p>
        <Link href={`/account/bookings/${bookingId}`} className="btn btn-outline mt-8">
          Вернуться к записи
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-8">
          <FormAlert>{error}</FormAlert>
        </div>
      )}
      <SlotPicker days={days} activeDate={activeDate} onActiveDate={setActiveDate} selected={selected} onSelect={setSelected} />
      <div className="sticky bottom-0 -mx-5 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 border-t border-line bg-ivory/95 px-5 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
        <p className="display text-[22px]">
          {selected ? `${formatDayMonth(selected.date)}, ${minToHHMM(selected.startMin)}` : <span className="font-sans text-[14px] text-ink-soft">Выберите новое время</span>}
        </p>
        <button
          className="btn btn-primary"
          disabled={!selected || pending}
          onClick={() =>
            selected &&
            start(async () => {
              setError(null);
              const res = await rescheduleBookingAction({ bookingId, ...selected });
              if (res.ok) {
                router.push(`/account/bookings/${bookingId}?moved=1`);
                return;
              }
              setError(res.error);
              if (res.slotTaken) {
                setSelected(null);
                setDays(await refreshSlotsAction(serviceId, masterId, bookingId));
              }
            })
          }
        >
          {pending ? "Переносим…" : "Перенести на это время"}
        </button>
      </div>
    </div>
  );
}
