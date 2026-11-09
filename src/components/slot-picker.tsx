"use client";

import { useEffect, useRef } from "react";
import type { DaySlots } from "@/lib/slots";
import { formatDayMonth, minToHHMM, weekdayShort } from "@/lib/time";

export type SlotSelection = { date: string; startMin: number } | null;

/** Лента из 14 дней + сетка свободного времени выбранного дня. */
export function SlotPicker({
  days,
  activeDate,
  onActiveDate,
  selected,
  onSelect,
}: {
  days: DaySlots[];
  activeDate: string | null;
  onActiveDate: (d: string) => void;
  selected: SlotSelection;
  onSelect: (s: SlotSelection) => void;
}) {
  const active = days.find((d) => d.date === activeDate) ?? null;
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Прокручиваем только ленту дат, не страницу
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: "smooth" });
  }, [activeDate]);

  const morning = active?.slots.filter((m) => m < 12 * 60) ?? [];
  const day = active?.slots.filter((m) => m >= 12 * 60 && m < 17 * 60) ?? [];
  const evening = active?.slots.filter((m) => m >= 17 * 60) ?? [];

  return (
    <div>
      <div ref={stripRef} className="relative -mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:px-0">
        {days.map((d) => {
          const has = d.slots.length > 0;
          const isActive = d.date === activeDate;
          const [, , dd] = d.date.split("-");
          return (
            <button
              key={d.date}
              type="button"
              disabled={!has}
              aria-pressed={isActive}
              aria-label={`${formatDayMonth(d.date)}, ${has ? `${d.slots.length} свободных` : "нет свободного времени"}`}
              onClick={() => onActiveDate(d.date)}
              className={`flex h-[76px] w-[58px] shrink-0 snap-start flex-col items-center justify-center rounded-full border transition-colors ${
                isActive
                  ? "border-ink bg-ink text-paper"
                  : has
                    ? "border-line bg-paper hover:border-ink"
                    : "cursor-not-allowed border-transparent text-muted/50"
              }`}
            >
              <span className="text-[10px] uppercase tracking-[0.14em]">{weekdayShort(d.date)}</span>
              <span className="display mt-0.5 text-[24px] leading-none">{Number(dd)}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-8">
          <p className="display text-[24px]">{formatDayMonth(active.date)}</p>
          <div className="mt-5 flex flex-col gap-6">
            {[
              ["Утро", morning],
              ["День", day],
              ["Вечер", evening],
            ].map(([label, list]) =>
              (list as number[]).length ? (
                <div key={label as string}>
                  <p className="label">{label as string}</p>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {(list as number[]).map((m) => {
                      const isSel = selected?.date === active.date && selected.startMin === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={isSel}
                          onClick={() => onSelect(isSel ? null : { date: active.date, startMin: m })}
                          className={`h-11 border text-[14px] tabular-nums transition-colors ${
                            isSel ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"
                          }`}
                        >
                          {minToHHMM(m)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
