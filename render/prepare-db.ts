// Запускается при каждом старте сервиса на Render (после prisma migrate deploy).
// 1) Пустая база → демо-данные (prisma/seed.ts).
// 2) Иначе продлевает график мастеров по шаблону недели до «сегодня + 28 дней»,
//    чтобы в демо всегда были свободные слоты. Заполняются только даты ПОСЛЕ
//    последнего существующего рабочего дня мастера — правки администратора не трогаются.
import { PrismaClient } from "@prisma/client";
import { addDays, dateStrToDb, dbToDateStr, todaySalon, weekdayOf } from "../src/lib/time";

const HORIZON_DAYS = 28;
const prisma = new PrismaClient();

async function main() {
  if ((await prisma.service.count()) === 0) {
    console.log("База пуста — загружаю демо-данные");
    await prisma.$disconnect();
    await import("../prisma/seed");
    return;
  }

  const today = todaySalon();
  const until = addDays(today, HORIZON_DAYS - 1);
  const masters = await prisma.master.findMany({
    where: { isActive: true },
    select: { id: true, weekly: true, workDays: { orderBy: { workDate: "desc" }, take: 1, select: { workDate: true } } },
  });

  let added = 0;
  for (const m of masters) {
    if (m.weekly.length === 0) continue;
    const last = m.workDays[0] ? dbToDateStr(m.workDays[0].workDate) : addDays(today, -1);
    let date = addDays(last > addDays(today, -1) ? last : addDays(today, -1), 1);
    const byWeekday = new Map(m.weekly.map((w) => [w.weekday, w]));
    const days = [];
    while (date <= until) {
      const t = byWeekday.get(weekdayOf(date));
      if (t) days.push({ masterId: m.id, workDate: dateStrToDb(date), startMin: t.startMin, endMin: t.endMin });
      date = addDays(date, 1);
    }
    if (days.length) {
      const r = await prisma.workDay.createMany({ data: days, skipDuplicates: true });
      added += r.count;
    }
  }
  console.log(`График продлён до ${until}: добавлено рабочих дней — ${added}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
