"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { loginAction, registerAction, type AuthState } from "@/actions/client-auth";
import { ConsentCheckbox, Field, FormAlert } from "./field";
import { PhoneInput } from "./phone-input";

const qs = (next?: string) => (next ? `?next=${encodeURIComponent(next)}` : "");

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next ?? ""} />
      {e.form && <FormAlert>{e.form}</FormAlert>}
      <Field label="Телефон" htmlFor="phone" error={e.phone}>
        <PhoneInput id="phone" defaultValue={state.values?.phone} invalid={!!e.phone} describedBy="phone-error" />
      </Field>
      <Field label="Пароль" htmlFor="password" error={e.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" aria-invalid={!!e.password || undefined} />
      </Field>
      <button className="btn btn-primary mt-2 w-full" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </button>
      <p className="text-center text-[14px] text-muted">
        Впервые у нас?{" "}
        <Link href={`/register${qs(next)}`} className="text-ink underline underline-offset-4 hover:text-accent">
          Создать кабинет
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, {});
  const [consent, setConsent] = useState(false);
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-6">
      <input type="hidden" name="next" value={next ?? ""} />
      {e.form && <FormAlert>{e.form}</FormAlert>}
      <Field label="Имя" htmlFor="name" error={e.name}>
        <input id="name" name="name" autoComplete="given-name" className="input" defaultValue={state.values?.name} aria-invalid={!!e.name || undefined} />
      </Field>
      <Field label="Телефон" htmlFor="phone" error={e.phone}>
        <PhoneInput id="phone" defaultValue={state.values?.phone} invalid={!!e.phone} />
      </Field>
      <Field label="Пароль" htmlFor="password" error={e.password} hint="Не менее 6 символов">
        <input id="password" name="password" type="password" autoComplete="new-password" className="input" aria-invalid={!!e.password || undefined} />
      </Field>
      <ConsentCheckbox checked={consent} onChange={setConsent} error={e.consent} />
      <button className="btn btn-primary mt-2 w-full" disabled={pending || !consent}>
        {pending ? "Создаём…" : "Создать кабинет"}
      </button>
      <p className="text-center text-[14px] text-muted">
        Уже есть кабинет?{" "}
        <Link href={`/login${qs(next)}`} className="text-ink underline underline-offset-4 hover:text-accent">
          Войти
        </Link>
      </p>
    </form>
  );
}
