import { SkeletonBar, SkeletonToggleRow } from "@/components/skeletons";

// Rendered inside the devops-admin layout, so the heading and nav stay put.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <SkeletonBar className="h-6 w-40" />
      <SkeletonToggleRow />
      <SkeletonToggleRow />
      <SkeletonToggleRow />
    </div>
  );
}
