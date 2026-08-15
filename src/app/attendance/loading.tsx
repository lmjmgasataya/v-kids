import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SkeletonBar } from "@/components/skeletons";
import { AttendanceSkeleton } from "./AttendanceSkeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Attendance" }]} />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Attendance</h2>
        <SkeletonBar className="h-9 w-28 rounded-full" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <SkeletonBar className="h-10 w-28 rounded-xl" />
          <SkeletonBar className="h-10 w-36 rounded-xl" />
          <SkeletonBar className="h-10 w-28 rounded-xl" />
        </div>
        <div className="flex gap-2">
          <SkeletonBar className="h-14 w-24 rounded-xl" />
          <SkeletonBar className="h-14 w-24 rounded-xl" />
          <SkeletonBar className="h-14 w-24 rounded-xl" />
        </div>
        <SkeletonBar className="h-4 w-48" />
        <AttendanceSkeleton />
      </div>
    </div>
  );
}
