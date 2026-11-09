import Link from "next/link";
import { formatDuration, formatPrice } from "@/lib/time";
import { groupByCategory, type ServiceWithMasters } from "@/lib/queries";

/** Прайс в духе меню ресторана: категория слева, услуги — строками с ценой и длительностью. */
export function ServiceList({ services, detailed = false }: { services: ServiceWithMasters[]; detailed?: boolean }) {
  const groups = groupByCategory(services);
  return (
    <div className="divide-y divide-line border-y border-line">
      {groups.map((g, gi) => (
        <section key={g.category} className="grid gap-6 py-10 md:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)] md:gap-12 md:py-14">
          <div>
            <span className="text-[12px] text-muted tabular-nums">{String(gi + 1).padStart(2, "0")}</span>
            <h3 className="display mt-2 text-[34px] md:text-[42px]">{g.category}</h3>
          </div>
          <ul className="flex flex-col">
            {g.items.map((s) => {
              const bookable = s.masters.length > 0;
              return (
                <li key={s.id}>
                  <article
                    className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 border-b border-line/70 py-5 last:border-0"
                    aria-label={s.name}
                  >
                    <h4 className="text-[17px] font-medium">{s.name}</h4>
                    <div className="text-right text-[17px] tabular-nums" data-testid="price">
                      {formatPrice(s.price)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
                      <span data-testid="duration">{formatDuration(s.durationMin)}</span>
                      {detailed && s.description && (
                        <>
                          <span aria-hidden>·</span>
                          <span>{s.description}</span>
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      {bookable ? (
                        <Link
                          href={`/book/${s.id}`}
                          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                        >
                          Записаться →
                        </Link>
                      ) : (
                        <span className="text-[12px] text-muted">нет свободных мастеров</span>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function NoServices() {
  // AC-01.3
  return (
    <div className="border-y border-line py-20 text-center">
      <p className="display text-[32px]">Услуги временно недоступны</p>
      <p className="mt-3 text-muted">Позвоните нам — мы подберём время вручную.</p>
    </div>
  );
}
