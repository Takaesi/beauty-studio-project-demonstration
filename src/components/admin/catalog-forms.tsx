"use client";

import { useActionState, useState, useTransition } from "react";
import { saveMasterAction, saveServiceAction, toggleMasterAction, toggleServiceAction, type FormState } from "@/actions/admin";
import { Field, FormAlert } from "../field";
import { Portrait } from "../portrait";

type Opt = { id: number; name: string; hint?: string; inactive?: boolean };

function CheckList({ name, options, selected }: { name: string; options: Opt[]; selected: number[] }) {
  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {options.map((o) => (
        <label key={o.id} className={`flex items-center gap-3 border-b border-line/70 py-2 text-[14px] ${o.inactive ? "text-muted" : ""}`}>
          <input type="checkbox" name={name} value={o.id} defaultChecked={selected.includes(o.id)} className="h-4 w-4 accent-[#1a1816]" />
          <span className="flex-1">{o.name}{o.inactive && " (скрыт)"}</span>
          {o.hint && <span className="text-[12px] text-muted">{o.hint}</span>}
        </label>
      ))}
      {!options.length && <p className="text-[13px] text-muted">Список пуст</p>}
    </div>
  );
}

function ActiveToggle({ defaultChecked, label, note }: { defaultChecked: boolean; label: string; note?: string }) {
  return (
    <label className="flex items-start gap-3 text-[14px]">
      <input type="checkbox" name="isActive" defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[#1a1816]" />
      <span>
        {label}
        {note && <span className="block text-[12px] text-muted">{note}</span>}
      </span>
    </label>
  );
}

export function ServiceForm({
  service,
  masters,
  categories,
  futureBookings,
}: {
  service?: { id: number; name: string; category: string; description: string; price: string; durationMin: number; isActive: boolean; masterIds: number[] };
  masters: Opt[];
  categories: string[];
  futureBookings: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveServiceAction, {});
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="flex max-w-3xl flex-col gap-6">
      {service && <input type="hidden" name="id" value={service.id} />}
      <Field label="Название" htmlFor="name" error={e.name}>
        <input id="name" name="name" className="input" defaultValue={service?.name} aria-invalid={!!e.name || undefined} />
      </Field>
      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Категория" htmlFor="category" hint="Группа в прайсе">
          <input id="category" name="category" list="categories" className="input" defaultValue={service?.category} />
          <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Цена, ₽" htmlFor="price" error={e.price}>
          <input id="price" name="price" inputMode="decimal" className="input tabular-nums" defaultValue={service?.price} aria-invalid={!!e.price || undefined} />
        </Field>
        <Field label="Длительность, мин" htmlFor="durationMin" error={e.durationMin}>
          <input id="durationMin" name="durationMin" type="number" min={5} step={5} className="input tabular-nums" defaultValue={service?.durationMin ?? 60} aria-invalid={!!e.durationMin || undefined} />
        </Field>
      </div>
      <Field label="Описание" htmlFor="description">
        <textarea id="description" name="description" className="input" defaultValue={service?.description} />
      </Field>
      <div>
        <p className="label">Мастера, которые выполняют услугу</p>
        <CheckList name="masterIds" options={masters} selected={service?.masterIds ?? []} />
      </div>
      <ActiveToggle
        defaultChecked={service?.isActive ?? true}
        label="Показывать на сайте"
        note={futureBookings ? `Будущих записей на услугу: ${futureBookings}. При скрытии они сохранятся.` : "Скрытая услуга не видна клиентам и недоступна для записи"}
      />
      <p className="text-[12px] text-muted">Изменение цены и длительности не затрагивает уже созданные записи.</p>
      <div>
        <button className="btn btn-primary" disabled={pending}>{pending ? "Сохраняем…" : "Сохранить"}</button>
      </div>
    </form>
  );
}

export function MasterForm({
  master,
  services,
  futureBookings,
}: {
  master?: { id: number; name: string; title: string; bio: string; photoUrl: string | null; isActive: boolean; serviceIds: number[] };
  services: Opt[];
  futureBookings: number;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveMasterAction, {});
  const [preview, setPreview] = useState<string | null>(master?.photoUrl ?? null);
  const e = state.errors ?? {};
  return (
    <form action={action} noValidate className="grid max-w-5xl gap-10 md:grid-cols-[240px_1fr]">
      {master && <input type="hidden" name="id" value={master.id} />}
      <div>
        <Portrait name={master?.name || "Новый мастер"} photoUrl={preview} />
        <label className="btn btn-outline btn-sm mt-4 w-full cursor-pointer">
          Загрузить фото
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        {master?.photoUrl && (
          <label className="mt-3 flex items-center gap-2 text-[13px] text-muted">
            <input type="checkbox" name="removePhoto" className="h-4 w-4" /> Удалить фото
          </label>
        )}
        {e.photo && <p className="field-error">{e.photo}</p>}
        <p className="mt-2 text-[12px] text-muted">JPG, PNG или WebP до 5 МБ, вертикальное 3:4</p>
      </div>
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Имя и фамилия" htmlFor="name" error={e.name}>
            <input id="name" name="name" className="input" defaultValue={master?.name} aria-invalid={!!e.name || undefined} />
          </Field>
          <Field label="Специализация" htmlFor="title">
            <input id="title" name="title" className="input" defaultValue={master?.title} placeholder="Стилист-колорист" />
          </Field>
        </div>
        <Field label="О мастере" htmlFor="bio">
          <textarea id="bio" name="bio" className="input" defaultValue={master?.bio} />
        </Field>
        <div>
          <p className="label">Услуги мастера</p>
          <CheckList name="serviceIds" options={services} selected={master?.serviceIds ?? []} />
        </div>
        <ActiveToggle
          defaultChecked={master?.isActive ?? true}
          label="Показывать на сайте и принимать запись"
          note={futureBookings ? `Будущих записей: ${futureBookings}. При скрытии мастера они сохранятся — перенесите или отмените их вручную.` : undefined}
        />
        <div>
          <button className="btn btn-primary" disabled={pending}>{pending ? "Сохраняем…" : master ? "Сохранить" : "Добавить мастера"}</button>
        </div>
        {Object.keys(e).length > 0 && <FormAlert>Проверьте поля формы</FormAlert>}
      </div>
    </form>
  );
}

export function ToggleButton({ id, kind, isActive }: { id: number; kind: "service" | "master"; isActive: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
      disabled={pending}
      onClick={() => start(() => (kind === "service" ? toggleServiceAction(id) : toggleMasterAction(id)))}
    >
      {isActive ? "Скрыть" : "Показать"}
    </button>
  );
}
