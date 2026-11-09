import "server-only";
import { prisma } from "./db";

/** Активные услуги, у которых есть хотя бы один активный мастер (иначе записаться некуда). */
export async function getActiveServices() {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: { masters: { where: { master: { isActive: true } }, select: { masterId: true } } },
  });
}

export type ServiceWithMasters = Awaited<ReturnType<typeof getActiveServices>>[number];

export function groupByCategory<T extends { category: string }>(items: T[]) {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const key = it.category.trim() || "Другое";
    map.set(key, [...(map.get(key) ?? []), it]);
  }
  return [...map.entries()].map(([category, items]) => ({ category, items }));
}

export async function getActiveMasters() {
  return prisma.master.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      services: {
        where: { service: { isActive: true } },
        include: { service: true },
        orderBy: { service: { sortOrder: "asc" } },
      },
    },
  });
}

export async function getMastersForService(serviceId: number) {
  return prisma.master.findMany({
    where: { isActive: true, services: { some: { serviceId } } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
}
