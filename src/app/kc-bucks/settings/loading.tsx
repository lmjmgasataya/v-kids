import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar, SkeletonField } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "Credit Settings" }]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Credit Settings</h2>
      <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex flex-col gap-4">
        <SkeletonField />
        <SkeletonBar className="h-11 w-24 rounded-xl" />
      </div>
    </div>
  );
}
