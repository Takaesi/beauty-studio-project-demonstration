import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormAlert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "success" | "info" }) {
  const cls =
    tone === "error"
      ? "border-danger/40 bg-[#fbf1ee] text-danger"
      : tone === "success"
        ? "border-success/40 bg-[#eef3ec] text-success"
        : "border-line bg-paper text-ink-soft";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`border px-4 py-3 text-[14px] ${cls}`}>
      {children}
    </div>
  );
}

export function ConsentCheckbox({
  checked,
  onChange,
  error,
  name = "consent",
}: {
  checked?: boolean;
  onChange?: (v: boolean) => void;
  error?: string;
  name?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug text-ink-soft">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a1816]"
        />
        <span>
          Я согласен(на) на обработку персональных данных в соответствии с{" "}
          <a href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-accent">
            политикой конфиденциальности
          </a>
        </span>
      </label>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
