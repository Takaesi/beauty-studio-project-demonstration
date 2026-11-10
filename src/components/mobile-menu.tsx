"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function MobileMenu({ nav }: { nav: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative -mr-2 flex h-11 w-11 items-center justify-center"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
      >
        <span className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
        <span className={`absolute h-px w-6 bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
      </button>
      {/* Портал в body: у шапки backdrop-filter, и fixed внутри неё считался бы от шапки, а не от экрана */}
      {open &&
        createPortal(
        <div className="fixed inset-x-0 top-[72px] bottom-0 z-50 flex flex-col overflow-y-auto bg-ivory px-5 pt-8 pb-10 md:hidden">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="display border-b border-line py-4 text-[34px]">
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/services" className="btn btn-primary mt-auto w-full">
            Записаться
          </Link>
        </div>,
          document.body,
        )}
    </div>
  );
}
