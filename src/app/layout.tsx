import type { Metadata } from "next";
import { Geist, Fredoka } from "next/font/google";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { NavigationProgress } from "@/components/NavigationProgress";
import { LogoMark } from "@/components/LogoMark";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });

export const metadata: Metadata = {
  title: "Kids Church",
  description: "Registration for Kids Church",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} ${fredoka.variable} min-h-full bg-gray-50 antialiased`}>
        <NavigationProgress />
        <header className="bg-white shadow-sm">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition">
              <LogoMark size={40} />
              <span className="text-xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
                Kids Church
              </span>
            </Link>
            {session && (
              <div className="flex items-center gap-4">
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
          <div className="h-1.5 flex">
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
