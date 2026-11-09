"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Записи" },
  { href: "/admin/schedule", label: "График" },
  { href: "/admin/masters", label: "Мастера" },
  { href: "/admin/services", label: "Услуги" },
  { href: "/admin/clients", label: "Клиенты" },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/bookings") : pathname.startsWith(href);
  return (
    <nav className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          className={`shrink-0 rounded-full px-4 py-2 text-[14px] transition-colors lg:rounded-none lg:border-l-2 lg:px-5 lg:py-2.5 ${
            isActive(i.href)
              ? "bg-ink text-paper lg:border-ink lg:bg-transparent lg:text-ink lg:font-medium"
              : "text-ink-soft hover:text-ink lg:border-transparent"
          }`}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
