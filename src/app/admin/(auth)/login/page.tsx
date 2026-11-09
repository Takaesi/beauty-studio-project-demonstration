import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/login-form";
import { SALON } from "@/config/salon";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход для администратора", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5">
      <div className="w-full max-w-[400px] bg-paper p-8 md:p-10">
        <p className="eyebrow">{SALON.name}</p>
        <h1 className="display mt-3 text-[40px]">Администратор</h1>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
