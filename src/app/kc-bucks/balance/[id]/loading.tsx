import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonDetailCard, SkeletonList } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Check Balance", href: "/kc-bucks/balance" },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Check Balance</h2>
      <SkeletonDetailCard accent="yellow">
        <div className="flex items-baseline gap-2">
          <SkeletonBar className="h-9 w-16" />
          <SkeletonBar className="h-3.5 w-16" />
        </div>
        <div>
          <SkeletonBar className="h-3 w-28 mb-2" />
          <SkeletonList rows={3} />
        </div>
      </SkeletonDetailCard>
    </div>
  );
}
