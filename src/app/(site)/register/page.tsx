import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";
import { getCurrentClient } from "@/lib/auth";

export const metadata: Metadata = { title: "Регистрация" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentClient()) redirect(next?.startsWith("/") ? next : "/account");
  return (
    <AuthShell
      eyebrow="Личный кабинет"
      title="Создать кабинет"
      lead="В кабинете — ваши записи: перенос и отмена в одно касание."
    >
      <RegisterForm next={next} />
    </AuthShell>
  );
}
