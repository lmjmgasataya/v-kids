import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonIdCard } from "@/components/skeletons";

export default function Loading() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Registered Kids", href: "/kids" }]} />
      <div className="flex flex-col items-center gap-6 py-6">
        <h2 className="text-2xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">ID Card</h2>
        <SkeletonIdCard />
        <SkeletonIdCard />
      </div>
    </div>
  );
}
