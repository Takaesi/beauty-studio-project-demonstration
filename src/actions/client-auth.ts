"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getCurrentClient, loginClient, logoutClient } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizePhone, PHONE_FORMAT_HINT } from "@/lib/phone";

export type AuthState = {
  errors?: Partial<Record<"name" | "phone" | "password" | "consent" | "form", string>>;
  values?: { name?: string; phone?: string };
};

const REQUIRED = "Заполните обязательное поле";

/** Разрешаем редирект только на внутренние пути. */
function safeNext(next: FormDataEntryValue | null) {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/account";
}

export async function registerAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = String(fd.get("name") ?? "").trim();
  const phoneRaw = String(fd.get("phone") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const consent = fd.get("consent") === "on";
  const errors: AuthState["errors"] = {};

  if (!name) errors.name = REQUIRED;
  const phone = normalizePhone(phoneRaw);
  if (!phoneRaw) errors.phone = REQUIRED;
  else if (!phone) errors.phone = PHONE_FORMAT_HINT;
  if (!password) errors.password = REQUIRED;
  else if (password.length < 6) errors.password = "Минимум 6 символов";
  if (!consent) errors.consent = "Нужно согласие на обработку персональных данных";
  if (Object.keys(errors).length) return { errors, values: { name, phone: phoneRaw } };

  const existing = await prisma.client.findUnique({ where: { phone: phone! } });
  if (existing?.passwordHash) {
    return { errors: { phone: "Этот номер уже зарегистрирован. Войдите в кабинет" }, values: { name, phone: phoneRaw } };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  // Если клиента раньше записал администратор по телефону — привязываем его записи к новому кабинету.
  const client = existing
    ? await prisma.client.update({ where: { id: existing.id }, data: { name, passwordHash } })
    : await prisma.client.create({ data: { name, phone: phone!, passwordHash } });

  await loginClient(client.id);
  redirect(safeNext(fd.get("next")));
}

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  const phoneRaw = String(fd.get("phone") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const errors: AuthState["errors"] = {};
  const phone = normalizePhone(phoneRaw);
  if (!phoneRaw) errors.phone = REQUIRED;
  else if (!phone) errors.phone = PHONE_FORMAT_HINT;
  if (!password) errors.password = REQUIRED;
  if (Object.keys(errors).length) return { errors, values: { phone: phoneRaw } };

  const client = await prisma.client.findUnique({ where: { phone: phone! } });
  const ok = !!client?.passwordHash && (await bcrypt.compare(password, client.passwordHash));
  if (!ok) return { errors: { form: "Неверный номер телефона или пароль" }, values: { phone: phoneRaw } };

  await loginClient(client!.id);
  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await logoutClient();
  redirect("/");
}

export async function updateProfileAction(_: { ok?: boolean; error?: string }, fd: FormData): Promise<{ ok?: boolean; error?: string }> {
  const client = await getCurrentClient();
  if (!client) redirect("/login");
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return { error: "Заполните обязательное поле" };
  await prisma.client.update({ where: { id: client.id }, data: { name } });
  return { ok: true };
}
