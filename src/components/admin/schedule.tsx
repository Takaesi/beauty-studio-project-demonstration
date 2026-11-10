"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import {
  fillFromTemplateAction,
  saveWeeklyTemplateAction,
  saveWorkDayAction,
  type FillResult,
  type FormState,
} from "@/actions/admin";
import { formatDayMonth, minToHHMM, WEEKDAY_NAMES, weekdayFull } from "@/lib/time";
import { FormAlert } from "../field";

export type CalendarDay = {
  date: string;
  work: { startMin: number; endMin: number } | null;
  bookings: number;
  isPast: boolean;
  isToday: boolean;
};

export function ScheduleCalendar({ masterId, days }: { masterId: number; days: CalendarDay[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("20:00");
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();
  const current = days.find((d) => d.date === editing);

  function open(d: CalendarDay) {
    setEditing(d.date);
    setError(null);
    setStart(d.work ? minToHHMM(d.work.startMin) : "10:00");
    setEnd(d.work ? minToHHMM(d.work.endMin) : "20:00");
  }

  function save(off: boolean) {
    if (!editing) return;
    run(async () => {
      const r = await saveWorkDayAction({ masterId, date: editing, start: off ? null : start, end: off ? null : end });
      if (!r.ok) setError(r.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-px border border-line bg-line text-[12px]">
        {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((w) => (
          <div key={w} className="bg-paper px-2 py-2 text-center uppercase tracking-[0.12em] text-muted">
            {w}
          </div>
        ))}
        {days.map((d) => {
          const [, , dd] = d.date.split("-");
          const sel = d.date === editing;
          return (
            <button
              key={d.date}
              type="button"
              disabled={d.isPast}
              onClick={() => open(d)}
              className={`flex min-h-[86px] min-w-0 flex-col items-start gap-1 p-2 text-left transition-colors sm:p-3 ${
                sel ? "bg-ink text-paper" : d.work ? "bg-paper hover:bg-sand" : "bg-ivory hover:bg-sand"
              } ${d.isPast ? "cursor-default opacity-45" : ""}`}
            >
              <span className={`display text-[20px] leading-none ${d.isToday && !sel ? "text-accent" : ""}`}>{Number(dd)}</span>
              {d.work ? (
                <span className="tabular-nums text-[11px] sm:text-[12px]">
                  {minToHHMM(d.work.startMin)}
                  <span className="hidden sm:inline">–{minToHHMM(d.work.endMin)}</span>
                </span>
              ) : (
                <span className={`text-[11px] ${sel ? "text-paper/60" : "text-muted"}`}>
                  <span className="sm:hidden">вых</span>
                  <span className="hidden sm:inline">выходной</span>
                </span>
              )}
              {d.bookings > 0 && (
                <span className={`mt-auto text-[10px] ${sel ? "text-paper/70" : "text-accent"}`}>{d.bookings} зап.</span>
              )}
            </button>
          );
        })}
      </div>

      {current && (
        <div className="card mt-6 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="display text-[26px]">
              {formatDayMonth(current.date)}, {weekdayFull(current.date)}
            </p>
            <button className="text-[13px] text-muted hover:text-ink" onClick={() => setEditing(null)}>Закрыть</button>
          </div>
          {error && <div className="mt-4"><FormAlert>{error}</FormAlert></div>}
          <div className="mt-5 flex flex-wrap items-end gap-4">
            <label className="flex flex-col">
              <span className="label">Начало</span>
              <input type="time" step={900} className="input !w-36" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label className="flex flex-col">
              <span className="label">Конец</span>
              <input type="time" step={900} className="input !w-36" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
            <button className="btn btn-primary btn-sm !h-[50px]" disabled={pending} onClick={() => save(false)}>
              {current.work ? "Сохранить" : "Сделать рабочим"}
            </button>
            {current.work && (
              <button className="btn btn-outline btn-sm !h-[50px]" disabled={pending} onClick={() => save(true)}>
                Сделать выходным
              </button>
            )}
          </div>
          {current.bookings > 0 && (
            <p className="mt-4 text-[13px] text-muted">
              В этот день {current.bookings} зап. — новые часы должны их вмещать.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function WeeklyTemplateForm({
  masterId,
  template,
}: {
  masterId: number;
  template: { weekday: number; startMin: number; endMin: number }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveWeeklyTemplateAction, {});
  const byWd = new Map(template.map((t) => [t.weekday, t]));
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="masterId" value={masterId} />
      {WEEKDAY_NAMES.map((name, i) => {
        const wd = i + 1;
        const t = byWd.get(wd);
        return (
          <div key={wd} className="grid grid-cols-[52px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
            <label className="flex items-center gap-2 text-[13px] uppercase tracking-[0.08em]" title={name}>
              <input type="checkbox" name={`on${wd}`} defaultChecked={!!t} className="h-4 w-4 accent-[#1a1816]" />
              {["пн", "вт", "ср", "чт", "пт", "сб", "вс"][i]}
            </label>
            <input type="time" step={900} name={`start${wd}`} defaultValue={t ? minToHHMM(t.startMin) : "10:00"} className="input !h-10 min-w-0 !px-2 text-[14px]" aria-label={`${name}, начало`} />
            <input type="time" step={900} name={`end${wd}`} defaultValue={t ? minToHHMM(t.endMin) : "20:00"} className="input !h-10 min-w-0 !px-2 text-[14px]" aria-label={`${name}, конец`} />
            {state.errors?.[`d${wd}`] && <p className="field-error col-span-3 !mt-0">{state.errors[`d${wd}`]}</p>}
          </div>
        );
      })}
      <div className="mt-3 flex items-center gap-4">
        <button className="btn btn-outline btn-sm" disabled={pending}>Сохранить шаблон</button>
        {state.ok && <span className="text-[13px] text-success">Сохранено</span>}
      </div>
    </form>
  );
}

export function FillFromTemplateForm({ masterId, from, to }: { masterId: number; from: string; to: string }) {
  const [state, action, pending] = useActionState<FillResult, FormData>(fillFromTemplateAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="masterId" value={masterId} />
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.ok && <FormAlert tone="success">{state.ok}</FormAlert>}
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">С</span>
          <input type="date" name="from" defaultValue={from} className="input !h-11 text-[14px]" />
        </label>
        <label>
          <span className="label">По</span>
          <input type="date" name="to" defaultValue={to} className="input !h-11 text-[14px]" />
        </label>
      </div>
      <label className="flex items-start gap-2 text-[13px] text-ink-soft">
        <input type="checkbox" name="overwrite" className="mt-0.5 h-4 w-4 accent-[#1a1816]" />
        Перезаписать уже заполненные дни (дни с записями, которые не помещаются, будут пропущены)
      </label>
      <div>
        <button className="btn btn-primary btn-sm" disabled={pending}>{pending ? "Заполняем…" : "Заполнить график"}</button>
      </div>
    </form>
  );
}
