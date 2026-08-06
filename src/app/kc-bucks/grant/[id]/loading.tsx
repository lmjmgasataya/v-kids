import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonDetailCard, SkeletonField } from "@/components/skeletons";

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
        <div>
          <SkeletonBar className="h-3 w-32 mb-2" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBar key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <SkeletonField />
        <SkeletonBar className="h-11 w-full rounded-xl" />
      </SkeletonDetailCard>
    </div>
  );
}
