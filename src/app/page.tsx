import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/LogoMark";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col items-center gap-10 py-12 text-center">
      <LogoMark size={96} />

      <div>
        <h2 className="text-4xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Welcome to Kids Church!
        </h2>
        <p className="mt-2 text-gray-500">Let&apos;s get you signed up for today 🎉</p>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-xs">
        <Link
          href="/register"
          className="flex flex-col items-center gap-3 rounded-3xl bg-kids-magenta text-white shadow-lg p-8 hover:scale-105 active:scale-95 transition"
        >
          <span className="text-5xl">📝</span>
          <span className="text-2xl font-bold font-[family-name:var(--font-fredoka)]">Register</span>
          <span className="text-sm text-white/80">Sign up a child for Kids Church</span>
        </Link>
      </div>
    </div>
  );
}
