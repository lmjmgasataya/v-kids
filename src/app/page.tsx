import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LogoMark } from "@/components/LogoMark";
import { RegisterTile } from "@/components/RegisterTile";

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
        <RegisterTile />
      </div>
    </div>
  );
}
