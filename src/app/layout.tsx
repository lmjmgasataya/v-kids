import type { Metadata } from "next";
import { Geist, Fredoka } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CURSOR_TRAIL_FLAG_KEY } from "@/lib/constants";
import { NavigationProgress } from "@/components/NavigationProgress";
import { LogoMark } from "@/components/LogoMark";
import { CursorTrail } from "@/components/CursorTrail";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });

export const metadata: Metadata = {
  title: "Kids Church",
  description: "Registration for Kids Church",
  icons: {
    icon: "/kids-logo.webp",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  const [cursorTrailFlag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.key, CURSOR_TRAIL_FLAG_KEY));
  const cursorTrailEnabled = cursorTrailFlag?.enabled ?? true;

  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} ${fredoka.variable} min-h-full antialiased`}>
        <NavigationProgress />
        {cursorTrailEnabled && <CursorTrail />}
        <header className="print:hidden bg-gradient-to-r from-kids-magenta/10 via-kids-yellow/10 to-kids-navy/10 backdrop-blur-sm shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <LogoMark size={40} />
              <span className="text-xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
                Kids Church
              </span>
            </Link>
            {session && (
              <div className="flex items-center gap-4">
                {session.role === "admin" && (
                  <Link
                    href="/settings"
                    aria-label="Settings"
                    className="text-gray-400 hover:text-kids-navy transition"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                )}
                <span className="text-xs text-gray-500 capitalize">{session.name}</span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-xs text-gray-400 hover:text-kids-navy underline underline-offset-2 transition"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
          <div className="h-2 flex">
            <div className="flex-1 bg-kids-magenta" />
            <div className="flex-1 bg-kids-navy" />
            <div className="flex-1 bg-kids-green" />
            <div className="flex-1 bg-kids-yellow" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
