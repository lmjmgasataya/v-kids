"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/reports", label: "Overview" },
  { href: "/reports/attendance", label: "Attendance" },
  { href: "/reports/families", label: "Families" },
  { href: "/reports/service-team", label: "Service Team" },
];

export function ReportsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {NAV.map(({ href, label }) => {
        const active = href === "/reports" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
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
