"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import {
  adminCancelAction,
  adminCreateBookingAction,
  adminDayInfoAction,
  adminFindClientAction,
  adminRescheduleAction,
  type AdminBookingState,
  type DayInfo,
} from "@/actions/admin";
import { minToHHMM } from "@/lib/time";
import { Field, FormAlert } from "../field";
import { PhoneInput } from "../phone-input";

/** Рабочие часы и занятость мастера в выбранный день — чтобы видеть, куда помещается запись. */
function DayPanel({ masterId, date, durationMin, excludeId }: { masterId: number; date: string; durationMin?: number; excludeId?: number }) {
  const [info, setInfo] = useState<DayInfo | null>(null);
  useEffect(() => {
    let alive = true;
    if (!masterId || !date) {
      setInfo(null);
      return;
    }
    adminDayInfoAction(masterId, date).then((r) => alive && setInfo(r));
    return () => {
      alive = false;
    };
  }, [masterId, date]);

  if (!masterId || !date) return <p className="text-[13px] text-muted">Выберите мастера и дату, чтобы увидеть занятость.</p>;
  if (!info) return <p className="text-[13px] text-muted">Загружаем…</p>;
  const list = info.bookings.filter((b) => b.id !== excludeId);
  return (
    <div className="text-[13px]">
      <p className="label">Мастер в этот день</p>
      {info.workDay ? (
        <p className="mb-3">
          Работает <b className="tabular-nums">{minToHHMM(info.workDay.startMin)}–{minToHHMM(info.workDay.endMin)}</b>
          {durationMin ? <span className="text-muted"> · услуга {durationMin} мин</span> : null}
        </p>
      ) : (
        <p className="mb-3 text-danger">Выходной — сначала добавьте рабочий день в графике</p>
      )}
      {list.length ? (
        <ul className="space-y-1">
          {list.map((b) => (
            <li key={b.id} className="flex gap-3">
              <span className="tabular-nums text-muted">{minToHHMM(b.startMin)}–{minToHHMM(b.endMin)}</span>
              <span className="truncate">{b.service} · {b.client}</span>
            </li>
          ))}
        </ul>
      ) : (
        info.workDay && <p className="text-muted">Записей нет — весь день свободен.</p>
      )}
    </div>
  );
}

type ServiceOpt = { id: number; name: string; durationMin: number; masterIds: number[] };
type MasterOpt = { id: number; name: string };

export function AdminNewBookingForm({
  services,
  masters,
  defaults,
}: {
  services: ServiceOpt[];
  masters: MasterOpt[];
  defaults: { date: string; masterId?: number; time?: string };
}) {
  const [state, action, pending] = useActionState<AdminBookingState, FormData>(adminCreateBookingAction, {});
  const e = state.errors ?? {};
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [known, setKnown] = useState(false);
  const [serviceId, setServiceId] = useState(0);
  const [masterId, setMasterId] = useState(defaults.masterId ?? 0);
  const [date, setDate] = useState(defaults.date);

  const service = services.find((s) => s.id === serviceId);
  const availableMasters = useMemo(
    () => (service ? masters.filter((m) => service.masterIds.includes(m.id)) : masters),
    [service, masters],
  );

  useEffect(() => {
    if (service && masterId && !service.masterIds.includes(masterId)) setMasterId(0);
  }, [service, masterId]);

  useEffect(() => {
    if (phone.replace(/\D/g, "").length !== 11) {
      setKnown(false);
      return;
    }
    adminFindClientAction(phone).then((c) => {
      setKnown(!!c);
      if (c && !name) setName(c.name);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    <form action={action} noValidate className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        {e.form && <FormAlert>{e.form}</FormAlert>}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Телефон клиента" htmlFor="phone" error={e.phone} hint={known ? "Клиент уже есть в базе" : undefined}>
            <PhoneInput id="phone" value={phone} onChange={setPhone} invalid={!!e.phone} />
          </Field>
          <Field label="Имя клиента" htmlFor="name" error={e.name}>
            <input id="name" name="name" className="input" value={name} onChange={(ev) => setName(ev.target.value)} aria-invalid={!!e.name || undefined} />
          </Field>
        </div>
        <Field label="Услуга" htmlFor="serviceId" error={e.serviceId}>
          <select id="serviceId" name="serviceId" className="input" value={serviceId} onChange={(ev) => setServiceId(Number(ev.target.value))}>
            <option value={0}>— выберите услугу —</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {s.durationMin} мин</option>
            ))}
          </select>
        </Field>
        <Field label="Мастер" htmlFor="masterId" error={e.masterId}>
          <select id="masterId" name="masterId" className="input" value={masterId} onChange={(ev) => setMasterId(Number(ev.target.value))}>
            <option value={0}>— выберите мастера —</option>
            {availableMasters.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Дата" htmlFor="date" error={e.date}>
            <input id="date" name="date" type="date" className="input" value={date} onChange={(ev) => setDate(ev.target.value)} />
          </Field>
          <Field label="Время" htmlFor="time" error={e.time}>
            <input id="time" name="time" type="time" step={900} className="input" defaultValue={defaults.time} />
          </Field>
        </div>
        <div>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Сохраняем…" : "Записать клиента"}</button>
        </div>
      </div>
      <aside className="card h-fit p-6">
        <DayPanel masterId={masterId} date={date} durationMin={service?.durationMin} />
      </aside>
    </form>
  );
}

export function AdminRescheduleForm({
  bookingId,
  masterId,
  durationMin,
  defaults,
}: {
  bookingId: number;
  masterId: number;
  durationMin: number;
  defaults: { date: string; time: string };
}) {
  const [state, action, pending] = useActionState<AdminBookingState, FormData>(adminRescheduleAction, {});
  const e = state.errors ?? {};
  const [date, setDate] = useState(defaults.date);
  return (
    <form action={action} noValidate className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-6">
        {e.form && <FormAlert>{e.form}</FormAlert>}
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Новая дата" htmlFor="r-date" error={e.date}>
            <input id="r-date" name="date" type="date" className="input" value={date} onChange={(ev) => setDate(ev.target.value)} />
          </Field>
          <Field label="Новое время" htmlFor="r-time" error={e.time}>
            <input id="r-time" name="time" type="time" step={900} className="input" defaultValue={defaults.time} />
          </Field>
        </div>
        <div>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Переносим…" : "Перенести запись"}</button>
        </div>
      </div>
      <aside className="card h-fit p-6">
        <DayPanel masterId={masterId} date={date} durationMin={durationMin} excludeId={bookingId} />
      </aside>
    </form>
  );
}

export function AdminCancelButton({ bookingId }: { bookingId: number }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!confirm)
    return (
      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(true)}>
        Отменить запись
      </button>
    );
  return (
    <div className="flex flex-col gap-3">
      {error && <FormAlert>{error}</FormAlert>}
      <p className="text-[14px]">Отменить запись? Время станет доступно другим клиентам.</p>
      <div className="flex gap-3">
        <button
          className="btn btn-danger btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await adminCancelAction(bookingId);
              if (!r.ok) setError(r.error);
              else router.refresh();
            })
          }
        >
          Да, отменить
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setConfirm(false)}>Нет</button>
      </div>
    </div>
  );
}
