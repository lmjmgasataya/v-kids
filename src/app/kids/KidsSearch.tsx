"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

export function KidsSearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(next: string) {
    setValue(next);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <input
      type="search"
      placeholder="Search by name…"
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kids-navy/40 focus:border-transparent"
    />
  );
}
