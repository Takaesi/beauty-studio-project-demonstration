"use client";

import { useActionState } from "react";
import { logoutAction, updateProfileAction } from "@/actions/client-auth";
import { formatPhone } from "@/lib/phone";
import { Field } from "./field";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, {});
  return (
    <div className="card p-6 md:p-8">
      <p className="eyebrow">Профиль</p>
      <form action={action} className="mt-6 flex flex-col gap-5">
        <Field label="Имя" htmlFor="p-name" error={state.error}>
          <input id="p-name" name="name" defaultValue={name} className="input" />
        </Field>
        <div>
          <span className="label">Телефон</span>
          <p className="text-[15px] tabular-nums">{formatPhone(phone)}</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="btn btn-outline btn-sm" disabled={pending}>Сохранить</button>
          {state.ok && <span className="text-[13px] text-success">Сохранено</span>}
        </div>
      </form>
      <form action={logoutAction} className="mt-8 border-t border-line pt-6">
        <button className="text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline">Выйти из кабинета</button>
      </form>
    </div>
  );
}
