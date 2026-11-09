"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Выбор даты, который пишет ?date= в адрес текущей страницы. */
export function DatePicker({ value, param = "date" }: { value: string; param?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <input
      type="date"
      className="input !h-[38px] !w-auto !rounded-full !px-4 text-[13px]"
      value={value}
      onChange={(e) => {
        if (!e.target.value) return;
        const next = new URLSearchParams(sp.toString());
        next.set(param, e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
    />
  );
}
