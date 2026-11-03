import { SkeletonBar } from "@/components/skeletons";

// Shown inside the reports layout (header + tabs stay put) while any report tab loads.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBar key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      <SkeletonBar className="h-64 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBar className="h-80 rounded-2xl" />
        <SkeletonBar className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
