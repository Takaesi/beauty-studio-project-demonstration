"use client";

import { useState } from "react";

/** Маска +7 900 123-45-67 */
export function maskPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8") || d.startsWith("7")) d = d.slice(1);
  d = d.slice(0, 10);
  let out = "+7";
  if (d.length) out += " " + d.slice(0, 3);
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

export function PhoneInput({
  name = "phone",
  defaultValue = "",
  value,
  onChange,
  invalid,
  id,
  describedBy,
}: {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
  invalid?: boolean;
  id?: string;
  describedBy?: string;
}) {
  const [inner, setInner] = useState(defaultValue ? maskPhone(defaultValue) : "");
  const v = value ?? inner;
  return (
    <input
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 900 123-45-67"
      className="input tabular-nums"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      value={v}
      onFocus={() => {
        if (!v) (onChange ?? setInner)("+7 ");
      }}
      onChange={(e) => {
        const next = e.target.value.length < 3 ? "" : maskPhone(e.target.value);
        (onChange ?? setInner)(next);
      }}
    />
  );
}
