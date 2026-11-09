// Демо-данные. Запуск: npm run db:seed (база очищается!)
import { PrismaClient } from "@prisma/client";
import { addDays, dateStrToDb, todaySalon, weekdayOf } from "../src/lib/time";

const prisma = new PrismaClient();

const services = [
  { key: "cut-w", name: "Женская стрижка", category: "Волосы", price: 4500, durationMin: 60, description: "Консультация, мытьё, стрижка и укладка." },
  { key: "gray", name: "Закрашивание седины", category: "Волосы", price: 5200, durationMin: 90, description: "Окрашивание корней в один тон с аккуратным покрытием седины." },
  { key: "airtouch", name: "Сложное окрашивание", category: "Волосы", price: 14000, durationMin: 240, description: "AirTouch, балаяж или шатуш — мягкие переходы и естественный блик." },
  { key: "perm", name: "Химическая завивка", category: "Волосы", price: 7800, durationMin: 120, description: "Бережный состав, крупные или мелкие локоны на выбор." },
  { key: "style", name: "Укладка", category: "Волосы", price: 2800, durationMin: 60, description: "Локоны, гладкая укладка или объём у корней." },
  { key: "mani", name: "Маникюр с покрытием", category: "Ногти", price: 3200, durationMin: 90, description: "Комбинированный маникюр, выравнивание и стойкое покрытие." },
  { key: "pedi", name: "Педикюр с покрытием", category: "Ногти", price: 4200, durationMin: 90, description: "Аппаратный педикюр, уход и покрытие." },
  { key: "brows", name: "Архитектура бровей", category: "Брови и ресницы", price: 2400, durationMin: 60, description: "Коррекция формы и окрашивание." },
  { key: "lami", name: "Ламинирование ресниц", category: "Брови и ресницы", price: 3500, durationMin: 90, description: "Изгиб, питание и окрашивание ресниц." },
  { key: "facial", name: "Уходовая чистка лица", category: "Лицо", price: 6500, durationMin: 90, description: "Комбинированная чистка, маска и массаж." },
];

const masters = [
  { name: "Ирина Соколова", title: "Топ-стилист, колорист", bio: "12 лет в профессии. Сложные окрашивания и бережная работа с сединой.", services: ["cut-w", "gray", "airtouch", "style"] },
  { name: "Мария Ветрова", title: "Стилист", bio: "Стрижки, завивка и укладки для съёмок и событий.", services: ["cut-w", "gray", "perm", "style"] },
  { name: "Алина Беккер", title: "Колорист", bio: "Натуральные оттенки и мягкие переходы.", services: ["gray", "airtouch", "perm"] },
  { name: "Софья Ким", title: "Мастер ногтевого сервиса", bio: "Чистый маникюр и лаконичный дизайн.", services: ["mani", "pedi"] },
  { name: "Ева Орлова", title: "Бровист, косметолог", bio: "Брови, ресницы и уходы за кожей лица.", services: ["brows", "lami", "facial"] },
];

// Шаблоны недели: [weekday, start, end] в часах
const templates: Array<Array<[number, number, number]>> = [
  [[1, 10, 19], [2, 10, 19], [3, 12, 21], [4, 12, 21], [5, 10, 19]],
  [[2, 11, 20], [3, 11, 20], [4, 11, 20], [6, 10, 18], [7, 10, 18]],
  [[1, 12, 21], [3, 10, 19], [5, 12, 21], [6, 10, 18]],
  [[1, 10, 19], [2, 10, 19], [4, 10, 19], [5, 10, 19], [6, 10, 18]],
  [[2, 12, 21], [3, 12, 21], [5, 10, 19], [6, 10, 18], [7, 10, 18]],
];

async function main() {
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.workDay.deleteMany();
  await prisma.weeklyTemplate.deleteMany();
  await prisma.masterService.deleteMany();
  await prisma.master.deleteMany();
  await prisma.service.deleteMany();
  await prisma.client.deleteMany();

  const svcIds = new Map<string, number>();
  for (const [i, s] of services.entries()) {
    const { key, ...data } = s;
    const created = await prisma.service.create({ data: { ...data, sortOrder: i } });
    svcIds.set(key, created.id);
  }

  const today = todaySalon();
  for (const [i, m] of masters.entries()) {
    const master = await prisma.master.create({
      data: {
        name: m.name,
        title: m.title,
        bio: m.bio,
        sortOrder: i,
        services: { create: m.services.map((k) => ({ serviceId: svcIds.get(k)! })) },
        weekly: { create: templates[i].map(([weekday, s, e]) => ({ weekday, startMin: s * 60, endMin: e * 60 })) },
      },
    });
    const byWeekday = new Map(templates[i].map(([w, s, e]) => [w, [s, e]]));
    const days = [];
    for (let d = 0; d < 28; d++) {
      const date = addDays(today, d);
      const t = byWeekday.get(weekdayOf(date));
      if (t) days.push({ masterId: master.id, workDate: dateStrToDb(date), startMin: t[0] * 60, endMin: t[1] * 60 });
    }
    await prisma.workDay.createMany({ data: days });
  }
  console.log(`Seeded: ${services.length} услуг, ${masters.length} мастеров, график на 28 дней от ${today}`);
}

main().finally(() => prisma.$disconnect());
