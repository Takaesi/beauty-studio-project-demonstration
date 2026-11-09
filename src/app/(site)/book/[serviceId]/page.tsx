import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Portrait } from "@/components/portrait";
import { Steps } from "@/components/steps";
import { prisma } from "@/lib/db";
import { getMastersForService } from "@/lib/queries";
import { formatDuration, formatPrice } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Выбор мастера" };

export default async function ChooseMasterPage({ params }: { params: Promise<{ serviceId: string }> }) {
  const serviceId = Number((await params).serviceId);
  const service = Number.isInteger(serviceId)
    ? await prisma.service.findFirst({ where: { id: serviceId, isActive: true } })
    : null;
  if (!service) notFound();
  const masters = await getMastersForService(service.id);

  return (
    <div className="wrap py-14 md:py-20">
      <Steps current={1} />
      <header className="mt-10 mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-line pb-10">
        <div>
          <Link href="/services" className="text-[13px] text-muted hover:text-ink">← Все услуги</Link>
          <h1 className="display mt-4 text-[44px] md:text-[68px]">{service.name}</h1>
          {service.description && <p className="mt-3 max-w-xl text-ink-soft">{service.description}</p>}
        </div>
        <div className="text-right">
          <div className="display text-[34px] tabular-nums">{formatPrice(service.price)}</div>
          <div className="text-[13px] text-muted">{formatDuration(service.durationMin)}</div>
        </div>
      </header>

      <h2 className="eyebrow mb-8">Выберите мастера</h2>
      {masters.length === 0 ? (
        <p className="text-muted">Сейчас эту услугу никто не выполняет. Позвоните нам — подберём вариант.</p>
      ) : (
        <div className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {masters.map((m) => (
            <article key={m.id} className="flex flex-col" data-testid="master-card">
              <Portrait name={m.name} photoUrl={m.photoUrl} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              <h3 className="display mt-6 text-[30px]">{m.name}</h3>
              <p className="mt-1 text-[13px] text-muted">{m.title}</p>
              {m.bio && <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{m.bio}</p>}
              <Link href={`/book/${service.id}/${m.id}`} className="btn btn-outline mt-6 self-start">
                Записаться к этому мастеру
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
