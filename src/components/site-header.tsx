import Link from "next/link";
import { SALON } from "@/config/salon";
import { getCurrentClient } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/services", label: "Услуги" },
  { href: "/masters", label: "Мастера" },
  { href: "/#contacts", label: "Контакты" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex flex-col leading-none ${className}`} aria-label={SALON.name}>
      <span className="display text-[26px] tracking-tight">{SALON.name}</span>
      <span className="mt-1 text-[9px] uppercase tracking-[0.34em] text-muted">{SALON.tagline}</span>
    </Link>
  );
}

export async function SiteHeader() {
  const client = await getCurrentClient();
  const account = client
    ? { href: "/account", label: "Кабинет" }
    : { href: "/login", label: "Войти" };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="wrap flex h-[72px] items-center justify-between gap-6">
        <Logo />
        <nav className="hidden items-center gap-10 text-[13px] tracking-wide md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-ink-soft transition-colors hover:text-accent">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-6 md:flex">
          <Link href={account.href} className="text-[13px] text-ink-soft transition-colors hover:text-accent">
            {account.label}
          </Link>
          <Link href="/services" className="btn btn-primary btn-sm">
            Записаться
          </Link>
        </div>
        <MobileMenu nav={[...NAV, account]} />
      </div>
    </header>
  );
}
