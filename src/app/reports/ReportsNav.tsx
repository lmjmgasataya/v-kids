"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// usesRange: the tab filters by ?range=, so carry the current choice across to it.
const NAV = [
  { href: "/reports", label: "Overview", usesRange: true },
  { href: "/reports/attendance", label: "Attendance", usesRange: true },
  { href: "/reports/families", label: "Families", usesRange: false },
  { href: "/reports/service-team", label: "Service Team", usesRange: false },
];

export function ReportsNav() {
  const pathname = usePathname();
  const range = useSearchParams().get("range");
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {NAV.map(({ href, label, usesRange }) => {
        const active = href === "/reports" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={usesRange && range ? `${href}?range=${range}` : href}
            className={`whitespace-nowrap px-4 py-1.5 text-sm font-semibold rounded-full transition ${
              active ? "bg-kids-navy text-white" : "bg-white text-kids-navy border border-kids-navy/20 hover:bg-kids-navy/5"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
