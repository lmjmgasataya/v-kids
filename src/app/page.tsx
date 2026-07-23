import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/LogoMark";
import { NavTile } from "@/components/NavTile";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <NavTile
          href="/register"
          icon="📝"
          label="Register"
          description="Sign up a child for Kids Church"
          color="kids-magenta"
        />
        <NavTile
          href="/kids"
          icon="📋"
          label="Registered Kids"
          description="View, search, and edit registrations"
          color="kids-green"
        />
      </div>
    </div>
  );
}
