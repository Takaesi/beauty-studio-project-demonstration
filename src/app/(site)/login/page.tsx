import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentClient } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentClient()) redirect(next?.startsWith("/") ? next : "/account");
  return (
    <AuthShell
      eyebrow="Личный кабинет"
      title="Вход"
      lead={next?.startsWith("/book") ? "Чтобы записаться, войдите в кабинет или создайте его — это займёт минуту." : undefined}
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
