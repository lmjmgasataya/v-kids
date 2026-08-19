import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonDetailCard } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Grant Credits", href: "/kc-bucks/grant" },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Grant Credits</h2>
      <SkeletonDetailCard accent="green">
        <SkeletonBar className="h-11 w-full rounded-xl" />
      </SkeletonDetailCard>
    </div>
  );
}
