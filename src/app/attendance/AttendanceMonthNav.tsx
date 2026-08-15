"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { shiftMonthString } from "@/lib/date";
import type { DateAttendanceSummary } from "@/lib/checkIn";
import { AttendanceSkeleton } from "./AttendanceSkeleton";

const cardDateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Manila",
});
const monthLabelFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Manila",
});

export function AttendanceMonthNav({
  month,
  currentMonth,
  dates,
  selectedDate,
  children,
}: {
  month: string;
  currentMonth: string;
  dates: DateAttendanceSummary[];
  selectedDate?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(nextMonth: string, nextDate?: string) {
    startTransition(() => {
      const params = new URLSearchParams({ month: nextMonth });
      if (nextDate) params.set("date", nextDate);
      router.push(`/attendance?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(shiftMonthString(month, -1))}
          className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
        >
          ← Prev month
        </button>
        <input
          type="month"
          value={month}
          max={currentMonth}
          onChange={(e) => e.target.value && navigate(e.target.value)}
          className="px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-gray-700"
        />
        <button
          type="button"
          onClick={() => navigate(shiftMonthString(month, 1))}
          disabled={month >= currentMonth}
          className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next month →
        </button>
        {isPending && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-kids-navy">
            <span className="w-3.5 h-3.5 border-2 border-kids-navy/30 border-t-kids-navy rounded-full animate-spin" />
            Loading…
          </span>
        )}
      </div>

      <div className="relative">
        <div className={isPending ? "flex flex-col gap-6 opacity-30 pointer-events-none" : "flex flex-col gap-6"}>
          {dates.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No check-ins recorded in {monthLabelFormatter.format(new Date(`${month}-01T00:00:00Z`))}.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((d) => {
                const isSelected = d.date === selectedDate;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => navigate(month, d.date)}
                    className={`shrink-0 flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-2.5 transition-[transform,background-color,color,box-shadow,border-color] duration-150 active:scale-95 hover:-translate-y-0.5 hover:shadow-md ${
                      isSelected
                        ? "bg-kids-navy border-kids-navy text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-600 hover:border-kids-navy/50 hover:text-kids-navy"
                    }`}
                  >
                    <span className="text-sm font-bold whitespace-nowrap">{cardDateFormatter.format(new Date(`${d.date}T00:00:00Z`))}</span>
                    <span className={`text-xs whitespace-nowrap ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                      {d.checkedIn} checked in{d.stillPresent > 0 ? ` · ${d.stillPresent} present` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {children}
        </div>
        {isPending && (
          <div className="absolute inset-0 top-0">
            <AttendanceSkeleton />
          </div>
        )}
      </div>
    </div>
  );
}
