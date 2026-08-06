import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonDetailCard, SkeletonField } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Redeem Credits", href: "/kc-bucks/redeem" },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Redeem Credits</h2>
      <SkeletonDetailCard accent="magenta">
        <div className="flex items-baseline gap-2">
          <SkeletonBar className="h-8 w-14" />
          <SkeletonBar className="h-3.5 w-28" />
        </div>
        <SkeletonField />
        <SkeletonField />
        <SkeletonBar className="h-11 w-full rounded-xl" />
      </SkeletonDetailCard>
    </div>
  );
}
