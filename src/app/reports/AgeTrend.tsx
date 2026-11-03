"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_BRACKETS, bracketIndexFor, loadBrackets, type AgeBracket } from "@/lib/ageBrackets";
import type { ReportSundayAges } from "@/lib/reports";
import { ColumnChart } from "./charts";
import { dateFromString, fullDateFormatter, shortDateFormatter } from "./format";

// One small column chart per age bracket (small multiples, same scale) so each group's trend
// reads on its own. Uses the brackets saved on this device from the attendance page.
export function AgeTrend({ sundays }: { sundays: ReportSundayAges[] }) {
  const [brackets, setBrackets] = useState<AgeBracket[]>(DEFAULT_BRACKETS);

  useEffect(() => {
    const stored = loadBrackets();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    if (stored) setBrackets(stored);
  }, []);

  const groups = [...brackets.map((b) => ({ label: `${b.label} (${b.min}–${b.max})` })), { label: "Other ages" }];
  const counts = sundays.map((s) => {
    const row = groups.map(() => 0);
    for (const age of s.ages) {
      const i = bracketIndexFor(age, brackets);
      row[i === -1 ? groups.length - 1 : i] += 1;
    }
    return row;
  });
  const max = Math.max(1, ...counts.flat());

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-gray-500">
        Age ranges come from the{" "}
        <Link href="/attendance" className="text-kids-navy hover:underline">
          Attendance page&apos;s age groups
        </Link>{" "}
        as saved on this device. All charts share the same scale.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((g, gi) => {
          const values = counts.map((row) => row[gi]);
          const peak = Math.max(...values);
          return (
            <div key={g.label} className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-gray-700">{g.label}</p>
              <ColumnChart
                height={90}
                max={max}
                data={sundays.map((s, si) => ({
                  key: s.date,
                  label: shortDateFormatter.format(dateFromString(s.date)),
                  value: values[si],
                  showValue: si === sundays.length - 1 || (values[si] === peak && values.indexOf(peak) === si),
                  tooltip: (
                    <>
                      <span className="block font-semibold">{fullDateFormatter.format(dateFromString(s.date))}</span>
                      <span className="block">
                        {values[si]} kids · {g.label}
                      </span>
                    </>
                  ),
                }))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
