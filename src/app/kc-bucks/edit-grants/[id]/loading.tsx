import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonDetailCard, SkeletonList } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "KC Bucks", href: "/kc-bucks" },
          { label: "Edit Grants", href: "/kc-bucks/edit-grants" },
        ]}
      />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Edit Grants</h2>
      <SkeletonDetailCard accent="green">
        <SkeletonList rows={3} />
      </SkeletonDetailCard>
    </div>
  );
}
