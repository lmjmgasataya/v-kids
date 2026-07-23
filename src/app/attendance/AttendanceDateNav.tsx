"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { shiftDateString } from "@/lib/date";
import { AttendanceSkeleton } from "./AttendanceSkeleton";

export function AttendanceDateNav({ date, today, children }: { date: string; today: string; children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(nextDate: string) {
    startTransition(() => {
      router.push(`/attendance?date=${nextDate}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(shiftDateString(date, -1))}
          className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          ← Prev day
        </button>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && navigate(e.target.value)}
          className="px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700"
        />
        <button
          type="button"
          onClick={() => navigate(shiftDateString(date, 1))}
          className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          Next day →
        </button>
        {isPending && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-kids-navy">
            <span className="w-3.5 h-3.5 border-2 border-kids-navy/30 border-t-kids-navy rounded-full animate-spin" />
            Loading…
          </span>
        )}
      </div>

      <div className="relative">
        <div className={isPending ? "opacity-30 pointer-events-none" : ""}>{children}</div>
        {isPending && (
          <div className="absolute inset-0 top-0">
            <AttendanceSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
