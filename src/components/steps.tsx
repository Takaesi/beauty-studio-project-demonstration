const STEPS = ["Услуга", "Мастер", "Время", "Подтверждение"];

export function Steps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] uppercase tracking-[0.18em]">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex items-center gap-3 ${i <= current ? "text-ink" : "text-muted/60"}`}>
          <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
          <span>{s}</span>
          {i < STEPS.length - 1 && <span className="h-px w-6 bg-line" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
