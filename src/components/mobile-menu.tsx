"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SALON } from "@/config/salon";

function Burger({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative -mr-2 flex h-11 w-11 items-center justify-center"
      aria-label={open ? "Закрыть меню" : "Открыть меню"}
      aria-expanded={open}
    >
      <span className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
      <span className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
    </button>
  );
}

export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Burger open={open} onClick={() => setOpen((v) => !v)} />
      {/* Полноэкранный непрозрачный слой в body: у шапки полупрозрачный фон и backdrop-filter,
          поэтому меню не может жить внутри неё — текст страницы просвечивал бы. */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Меню"
            className="fixed inset-0 z-[100] flex flex-col bg-ivory md:hidden"
            style={{ backgroundColor: "#f5f1ea" }}
          >
            <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
              <Link href="/" onClick={close} className="inline-flex flex-col leading-none" aria-label={SALON.name}>
                <span className="display text-[26px] tracking-tight">{SALON.name}</span>
                <span className="mt-1 text-[9px] uppercase tracking-[0.34em] text-muted">{SALON.tagline}</span>
              </Link>
              <Burger open onClick={close} />
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-5 pt-6 pb-10">
              <nav className="flex flex-col">
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} onClick={close} className="display border-b border-line py-4 text-[34px]">
                    {n.label}
                  </Link>
                ))}
              </nav>
              <Link href="/services" onClick={close} className="btn btn-primary mt-auto w-full">
                Записаться
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
