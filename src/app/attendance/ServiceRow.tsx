"use client";

import { useState } from "react";
import type { ServiceAttendance } from "@/lib/checkIn";

const timeFormatter = new Intl.DateTimeFormat("en-PH", { timeStyle: "short" });

export function ServiceRow({ row }: { row: ServiceAttendance }) {
  const [open, setOpen] = useState(false);
  const hasKids = row.checkedIn > 0;

  return (
    <>
      <tr className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
        <td className="px-4 py-3 font-medium text-gray-900">
          <button
            type="button"
            onClick={() => hasKids && setOpen((v) => !v)}
            className={`flex items-center gap-2 ${hasKids ? "" : "cursor-default"}`}
          >
            <span
              className={`text-gray-400 text-[10px] transition-transform ${open ? "rotate-90" : ""} ${
                hasKids ? "" : "invisible"
              }`}
            >
              ▶
            </span>
            {row.service}
          </button>
        </td>
        <td className="px-4 py-3 text-right text-gray-900">{row.checkedIn}</td>
        <td className="px-4 py-3 text-right text-gray-500">{row.checkedOut}</td>
        <td className="px-4 py-3 text-right">
          {row.stillPresent > 0 ? (
            <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1">
              {row.stillPresent}
            </span>
          ) : (
            <span className="text-gray-300">0</span>
          )}
        </td>
      </tr>
      {open && hasKids && (
        <tr className="border-b border-gray-100 last:border-0 bg-gray-50/70">
          <td colSpan={4} className="px-4 py-3">
            <ul className="flex flex-col divide-y divide-gray-100">
              {row.kids.map((kid) => (
                <li key={kid.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-gray-800">
                    {kid.firstName} {kid.lastName}
                    {kid.nickname && <span className="text-xs text-gray-400"> &quot;{kid.nickname}&quot;</span>}
                    <span className="text-xs text-gray-400"> · Age {kid.age}</span>
                  </span>
                  {kid.checkedOutAt ? (
                    <span className="text-xs text-gray-400">
                      Checked out {timeFormatter.format(kid.checkedOutAt)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-kids-green bg-kids-green/10 rounded-full px-2 py-1">
                      In since {timeFormatter.format(kid.checkedInAt)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  );
}
