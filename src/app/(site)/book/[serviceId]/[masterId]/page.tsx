import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/booking-flow";
import { Steps } from "@/components/steps";
import { requireClient } from "@/lib/auth";
import { getBookableOffer, getClientSlots } from "@/lib/booking";
import { formatPrice } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Выбор времени" };

export default async function ChooseTimePage({ params }: { params: Promise<{ serviceId: string; masterId: string }> }) {
  const p = await params;
  const serviceId = Number(p.serviceId);
  const masterId = Number(p.masterId);
  // Записаться можно только из личного кабинета
  const client = await requireClient(`/book/${p.serviceId}/${p.masterId}`);
  const offer = Number.isInteger(serviceId) && Number.isInteger(masterId) ? await getBookableOffer(serviceId, masterId) : null;
  if (!offer) notFound();
  const { service, master } = offer;
  const days = await getClientSlots({ serviceId, masterId, durationMin: service.durationMin });

  return (
    <div className="wrap py-14 md:py-20">
      <Steps current={2} />
      <header className="mt-10 mb-12 border-b border-line pb-10">
        <Link href={`/book/${service.id}`} className="text-[13px] text-muted hover:text-ink">← Другой мастер</Link>
        <h1 className="display mt-4 text-[40px] md:text-[60px]">
          {master.name}
        </h1>
        <p className="mt-2 text-ink-soft">
          {service.name} · {service.durationMin} мин · {formatPrice(service.price)}
        </p>
      </header>
      <BookingFlow
        service={{ id: service.id, name: service.name, durationMin: service.durationMin, priceText: formatPrice(service.price) }}
        master={{ id: master.id, name: master.name, title: master.title }}
        initialDays={days}
        defaults={{ name: client.name, phone: client.phone }}
      />
    </div>
  );
}
