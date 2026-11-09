import type { Metadata } from "next";
import Link from "next/link";
import { Portrait } from "@/components/portrait";
import { getActiveMasters } from "@/lib/queries";
import { formatPrice } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Мастера" };

export default async function MastersPage() {
  const masters = await getActiveMasters();
  return (
    <div className="wrap py-16 md:py-24">
      <header className="mb-16 max-w-2xl">
        <p className="eyebrow">Команда</p>
        <h1 className="display mt-4 text-[52px] md:text-[80px]">Мастера</h1>
      </header>
      <div className="flex flex-col gap-20 md:gap-28">
        {masters.map((m, i) => (
          <article
            key={m.id}
            id={`m${m.id}`}
            className={`grid scroll-mt-28 items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            <div className="mx-auto w-full max-w-[380px]">
              <Portrait name={m.name} photoUrl={m.photoUrl} sizes="(min-width: 768px) 380px, 90vw" />
            </div>
            <div className="md:pt-10">
              <p className="eyebrow">{m.title}</p>
              <h2 className="display mt-3 text-[40px] md:text-[56px]">{m.name}</h2>
              {m.bio && <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-ink-soft">{m.bio}</p>}
              {m.services.length > 0 && (
                <ul className="mt-10 max-w-lg border-t border-line">
                  {m.services.map(({ service: s }) => (
                    <li key={s.id}>
                      <Link
                        href={`/book/${s.id}/${m.id}`}
                        className="group flex items-baseline justify-between gap-4 border-b border-line py-4 transition-colors hover:text-accent"
                      >
                        <span>{s.name}</span>
                        <span className="flex items-baseline gap-4 text-[14px] tabular-nums">
                          {formatPrice(s.price)}
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">→</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
        {masters.length === 0 && <p className="text-muted">Информация о мастерах скоро появится.</p>}
      </div>
    </div>
  );
}
