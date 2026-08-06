import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Register", href: "/register" },
          { label: "Register a Child", href: "/register/child" },
          { label: "Success" },
        ]}
      />
      <div className="flex flex-col items-center gap-6 py-20 text-center">
        <span className="text-6xl">🎉</span>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          You&apos;re all set!
        </h2>
        <p className="text-gray-500 max-w-sm">Thanks for registering. See you at Kids Church!</p>
        <SkeletonBar className="h-24 w-full max-w-sm rounded-2xl" />
      </div>
    </div>
  );
}
