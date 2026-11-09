import Link from "next/link";
import { SALON } from "@/config/salon";
import { Portrait } from "@/components/portrait";
import { NoServices, ServiceList } from "@/components/service-list";
import { getActiveMasters, getActiveServices } from "@/lib/queries";

export const dynamic = "force-dynamic";

const PRINCIPLES = [
  { n: "I", title: "Без спешки", text: "Между гостями — время на подготовку. Никаких очередей и ожидания в холле." },
  { n: "II", title: "Честная консультация", text: "Мастер расскажет, что действительно подойдёт, — даже если это меньше, чем вы планировали." },
  { n: "III", title: "Профессиональная косметика", text: "Работаем с бережными составами и стерилизуем инструменты по медицинскому стандарту." },
];

export default async function HomePage() {
  const [services, masters] = await Promise.all([getActiveServices(), getActiveMasters()]);
  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))];

  return (
    <>
      {/* ——— Hero ——— */}
      <section className="wrap grid items-center gap-12 pt-10 pb-20 md:grid-cols-[1.15fr_1fr] md:gap-16 md:pt-16 md:pb-28">
        <div className="rise">
          <p className="eyebrow">Студия красоты · Москва</p>
          <h1 className="display mt-6 text-[52px] sm:text-[68px] lg:text-[92px]">
            Искусство
            <br />
            <em className="text-accent">неспешного</em> ухода
          </h1>
          <p className="mt-8 max-w-md text-[16px] leading-relaxed text-ink-soft">
            Волосы, ногти, брови и кожа — в одном пространстве, где о вас помнят. Выберите услугу и мастера, а
            удобное время найдётся онлайн.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/services" className="btn btn-primary">
              Записаться онлайн
            </Link>
            <Link href="/masters" className="link-underline text-[13px] tracking-wide">
              Познакомиться с мастерами
            </Link>
          </div>
        </div>
        <div className="rise rise-2 relative mx-auto w-full max-w-[460px]">
          <div className="arch placeholder-photo aspect-[4/5] w-full" role="img" aria-label="Интерьер студии" />
          <div className="absolute -bottom-6 -left-4 card px-6 py-5 shadow-[0_20px_40px_-24px_rgba(26,24,22,0.35)] sm:-left-10">
            <div className="eyebrow">Без выходных</div>
            <div className="display mt-1 text-[28px]">с 10:00</div>
          </div>
        </div>
      </section>

      {/* ——— Категории ——— */}
      {categories.length > 0 && (
        <section className="border-y border-line bg-paper">
          <div className="wrap flex flex-wrap justify-between gap-x-10 gap-y-4 py-7">
            {categories.map((c, i) => (
              <div key={c} className="flex items-baseline gap-3">
                <span className="text-[11px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="display text-[24px] md:text-[28px]">{c}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ——— О студии ——— */}
      <section className="wrap py-24 md:py-32">
        <div className="grid gap-14 md:grid-cols-[1fr_1.4fr]">
          <p className="eyebrow">О студии</p>
          <div>
            <p className="display text-[30px] leading-[1.2] md:text-[40px]">
              Мы создали место, куда хочется возвращаться: светлые кабинеты, внимательные мастера и результат,
              который <em className="text-accent">выглядит естественно</em>.
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <div key={p.n}>
                  <div className="display text-[22px] italic text-accent">{p.n}</div>
                  <h3 className="mt-3 text-[15px] font-semibold">{p.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ——— Услуги ——— */}
      <section className="wrap pb-24 md:pb-32" id="services">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Прайс</p>
            <h2 className="display mt-4 text-[44px] md:text-[64px]">Услуги</h2>
          </div>
          <Link href="/services" className="link-underline text-[13px] tracking-wide">
            Подробнее об услугах
          </Link>
        </div>
        {services.length ? <ServiceList services={services} /> : <NoServices />}
      </section>

      {/* ——— Мастера ——— */}
      {masters.length > 0 && (
        <section className="bg-paper py-24 md:py-32">
          <div className="wrap">
            <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Команда</p>
                <h2 className="display mt-4 text-[44px] md:text-[64px]">Мастера</h2>
              </div>
              <Link href="/masters" className="link-underline text-[13px] tracking-wide">
                Все мастера
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8">
              {masters.slice(0, 4).map((m) => (
                <Link key={m.id} href={`/masters#m${m.id}`} className="group">
                  <div className="overflow-hidden">
                    <Portrait
                      name={m.name}
                      photoUrl={m.photoUrl}
                      className="transition-transform duration-700 ease-[var(--ease-soft)] group-hover:scale-[1.03]"
                    />
                  </div>
                  <h3 className="display mt-5 text-[24px] md:text-[28px]">{m.name}</h3>
                  <p className="mt-1 text-[13px] text-muted">{m.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ——— Контакты (US-06) ——— */}
      <section id="contacts" className="wrap scroll-mt-24 py-24 md:py-32">
        <div className="grid gap-12 md:grid-cols-2 md:gap-20">
          <div>
            <p className="eyebrow">Контакты</p>
            <h2 className="display mt-4 text-[44px] md:text-[64px]">Ждём вас</h2>
            <dl className="mt-12 space-y-8">
              <div>
                <dt className="label">Адрес</dt>
                <dd className="text-[18px]">{SALON.address}</dd>
                <dd className="text-[14px] text-muted">{SALON.metro}</dd>
              </div>
              <div>
                <dt className="label">Телефон</dt>
                <dd className="text-[18px]">
                  <a href={`tel:${SALON.phoneHref}`} className="link-underline">
                    {SALON.phone}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="label">График работы</dt>
                {SALON.hours.map((h) => (
                  <dd key={h.days} className="flex max-w-xs justify-between text-[18px]">
                    <span>{h.days}</span>
                    <span className="tabular-nums">{h.time}</span>
                  </dd>
                ))}
              </div>
            </dl>
          </div>
          <div className="placeholder-photo-dark relative min-h-[360px] overflow-hidden">
            {/* Место для карты (Яндекс.Карты) — заглушка */}
            <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden>
              <defs>
                <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
                  <path d="M56 0H0V56" fill="none" stroke="#f5f1ea" strokeWidth="0.6" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-paper">
              <span className="h-3 w-3 rounded-full bg-paper ring-8 ring-paper/20" />
              <span className="display mt-4 text-[22px]">{SALON.name}</span>
            </div>
            <a
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(SALON.address)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm absolute bottom-6 left-6 bg-paper text-ink hover:bg-sand"
            >
              Открыть карту
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
