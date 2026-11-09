"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/actions/admin";
import { Field, FormAlert } from "../field";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Field label="Логин" htmlFor="login">
        <input id="login" name="login" className="input" autoComplete="username" required />
      </Field>
      <Field label="Пароль" htmlFor="password">
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </Field>
      <button className="btn btn-primary mt-2" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </button>
    </form>
  );
}
