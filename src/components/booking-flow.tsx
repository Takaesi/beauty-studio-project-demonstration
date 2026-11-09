"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBookingAction, refreshSlotsAction } from "@/actions/booking";
import type { DaySlots } from "@/lib/slots";
import { formatDayMonth, formatDuration, minToHHMM, weekdayFull } from "@/lib/time";
import { ConsentCheckbox, Field, FormAlert } from "./field";
import { PhoneInput, maskPhone } from "./phone-input";
import { SlotPicker, type SlotSelection } from "./slot-picker";

type Props = {
  service: { id: number; name: string; durationMin: number; priceText: string };
  master: { id: number; name: string; title: string };
  initialDays: DaySlots[];
  defaults: { name: string; phone: string };
};

export function BookingFlow({ service, master, initialDays, defaults }: Props) {
  const router = useRouter();
  const [days, setDays] = useState(initialDays);
  const [activeDate, setActiveDate] = useState<string | null>(initialDays.find((d) => d.slots.length)?.date ?? null);
  const [selected, setSelected] = useState<SlotSelection>(null);
  const [step, setStep] = useState<"time" | "form">("time");
  const [name, setName] = useState(defaults.name);
  const [phone, setPhone] = useState(maskPhone(defaults.phone));
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "phone" | "consent", string>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const hasAny = days.some((d) => d.slots.length);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setNotice(null);
    start(async () => {
      const res = await createBookingAction({
        serviceId: service.id,
        masterId: master.id,
        date: selected.date,
        startMin: selected.startMin,
        name,
        phone,
        consent,
      });
      if (res.ok) {
        router.push(`/account/bookings/${res.id}?created=1`);
        return;
      }
      setErrors(res.fieldErrors ?? {});
      if (res.slotTaken) {
        // AC-03.4: назад к расписанию, имя и телефон остаются в форме
        if (res.slots) setDays(res.slots);
        setSelected(null);
        setStep("time");
        setNotice(res.error ?? null);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (res.error) {
        setNotice(res.error);
      }
    });
  }

  async function reload() {
    const fresh = await refreshSlotsAction(service.id, master.id);
    setDays(fresh);
  }

  const summary = (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-[14px] sm:grid-cols-4">
      <div>
        <dt className="label">Услуга</dt>
        <dd>{service.name}</dd>
      </div>
      <div>
        <dt className="label">Мастер</dt>
        <dd>{master.name}</dd>
      </div>
      <div>
        <dt className="label">Дата и время</dt>
        <dd>
          {selected ? (
            <>
              {formatDayMonth(selected.date)}, {minToHHMM(selected.startMin)}
              <span className="block text-[12px] text-muted">{weekdayFull(selected.date)}</span>
            </>
          ) : (
            <span className="text-muted">не выбрано</span>
          )}
        </dd>
      </div>
      <div>
        <dt className="label">Стоимость</dt>
        <dd>
          {service.priceText}
          <span className="block text-[12px] text-muted">{formatDuration(service.durationMin)}</span>
        </dd>
      </div>
    </dl>
  );

  return (
    <div>
      {notice && (
        <div className="mb-8">
          <FormAlert>{notice}</FormAlert>
        </div>
      )}

      {step === "time" && (
        <>
          {hasAny ? (
            <SlotPicker
              days={days}
              activeDate={activeDate}
              onActiveDate={(d) => {
                setActiveDate(d);
              }}
              selected={selected}
              onSelect={setSelected}
            />
          ) : (
            <div className="border-y border-line py-14 text-center">
              <p className="display text-[28px]">
                Приносим свои извинения, но в ближайшие 14 дней у мастера нет свободного для записи времени
              </p>
              <a href={`/book/${service.id}`} className="btn btn-outline mt-8">
                Вернуться к списку мастеров
              </a>
            </div>
          )}

          {/* Нижняя панель выбора — всегда под рукой на мобильном */}
          {hasAny && (
            <div className="sticky bottom-0 z-10 -mx-5 mt-10 border-t border-line bg-ivory/95 px-5 py-4 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <p className="text-[14px] text-ink-soft">
                  {selected ? (
                    <>
                      <span className="display text-[22px] text-ink">
                        {formatDayMonth(selected.date)}, {minToHHMM(selected.startMin)}
                      </span>
                    </>
                  ) : (
                    "Выберите удобное время"
                  )}
                </p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={reload} className="shrink-0 text-[12px] text-muted underline-offset-4 hover:underline">
                    Обновить
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary flex-1 !px-5 sm:flex-none sm:!px-7"
                    disabled={!selected}
                    onClick={() => {
                      setNotice(null);
                      setStep("form");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    Записаться на это время
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {step === "form" && selected && (
        <form onSubmit={submit} noValidate className="max-w-2xl">
          {/* AC-02.3: над формой видны услуга, мастер, дата и время */}
          <div className="card p-6 md:p-8">{summary}</div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Field label="Имя" htmlFor="b-name" error={errors.name}>
              <input
                id="b-name"
                className="input"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={!!errors.name || undefined}
              />
            </Field>
            <Field label="Телефон" htmlFor="b-phone" error={errors.phone}>
              <PhoneInput id="b-phone" value={phone} onChange={setPhone} invalid={!!errors.phone} />
            </Field>
          </div>
          <div className="mt-6">
            <ConsentCheckbox checked={consent} onChange={setConsent} error={errors.consent} />
          </div>
          <div className="mt-10 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline"
              onClick={() => setStep("time")}
            >
              ← Изменить время
            </button>
            {/* NFR-03: без галочки кнопка неактивна */}
            <button className="btn btn-primary" disabled={!consent || pending}>
              {pending ? "Записываем…" : "Записаться"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
