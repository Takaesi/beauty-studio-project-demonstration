import type { Metadata } from "next";
import { NoServices, ServiceList } from "@/components/service-list";
import { getActiveServices } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Услуги и цены" };

export default async function ServicesPage() {
  const services = await getActiveServices();
  return (
    <div className="wrap py-16 md:py-24">
      <header className="mb-12 max-w-2xl md:mb-16">
        <p className="eyebrow">Шаг 1 из 3 · Выберите услугу</p>
        <h1 className="display mt-4 text-[52px] md:text-[80px]">Услуги и цены</h1>
        <p className="mt-6 text-[16px] text-ink-soft">
          Стоимость указана за процедуру. Окончательную цену для сложных услуг мастер согласует с вами на
          консультации.
        </p>
      </header>
      {services.length ? <ServiceList services={services} detailed /> : <NoServices />}
    </div>
  );
}
