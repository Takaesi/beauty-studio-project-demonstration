import Link from "next/link";
import { SALON } from "@/config/salon";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-paper/80">
      <div className="wrap grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="display text-[34px] text-paper">{SALON.name}</div>
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-paper/55">
            Студия красоты, где время замедляется. Запись онлайн — в пару касаний.
          </p>
        </div>
        <div>
          <div className="eyebrow !text-paper/45">Адрес</div>
          <p className="mt-4 text-[14px] leading-relaxed">
            {SALON.address}
            <br />
            <span className="text-paper/55">{SALON.metro}</span>
          </p>
        </div>
        <div>
          <div className="eyebrow !text-paper/45">Связь</div>
          <p className="mt-4 flex flex-col gap-1 text-[14px]">
            <a href={`tel:${SALON.phoneHref}`} className="hover:text-paper">{SALON.phone}</a>
            <span className="text-paper/55">{SALON.email}</span>
            <span className="text-paper/55">Telegram {SALON.telegram}</span>
          </p>
        </div>
        <div>
          <div className="eyebrow !text-paper/45">Часы работы</div>
          <ul className="mt-4 space-y-1 text-[14px]">
            {SALON.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-4">
                <span className="text-paper/55">{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-paper/10 py-6 text-[12px] text-paper/45 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {SALON.name}</span>
        <Link href="/privacy" className="hover:text-paper">Политика конфиденциальности</Link>
      </div>
    </footer>
  );
}
