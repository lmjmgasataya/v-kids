import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function RegisterTeamSuccessPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Register", href: "/register" },
          { label: "Register a Service Team Member", href: "/register/team" },
          { label: "Success" },
        ]}
      />
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          You&apos;re all set!
        </h2>
        <p className="text-gray-500 max-w-sm">
          Thanks for registering as a service team member. See you at Kids Church!
        </p>
        <Link href="/" className="text-sm font-semibold text-kids-magenta hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
