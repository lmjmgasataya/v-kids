import { Breadcrumbs } from "@/components/Breadcrumbs";
import { NavTile } from "@/components/NavTile";

export default function RegisterPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Register" }]} />

      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Who are we registering?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
          <NavTile
            href="/register/child"
            icon="📝"
            label="Register a Child"
            description="Sign up a child for Kids Church"
            color="kids-magenta"
          />
          <NavTile
            href="/register/team"
            icon="🙋"
            label="Register a Service Team Member"
            description="Sign up a volunteer or staff member"
            color="kids-navy"
          />
        </div>
      </div>
    </div>
  );
}
