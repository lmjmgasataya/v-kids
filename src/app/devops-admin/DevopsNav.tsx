"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/devops-admin", label: "Overview" },
  { href: "/devops-admin/data", label: "Data" },
  { href: "/devops-admin/login-logs", label: "Login Logs" },
  { href: "/devops-admin/check-stm", label: "Check STM QR" },
];

export function DevopsNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 overflow-x-auto pb-1">
      {NAV.map(({ href, label }) => {
        const active = href === "/devops-admin" ? pathname === href : pathname.startsWith(href);
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
