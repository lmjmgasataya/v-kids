import { SERVICE_OPTIONS } from "@/lib/constants";

export function AttendanceSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="h-3 w-24 rounded skeleton-shimmer" />
        <div className="h-3 w-16 rounded skeleton-shimmer ml-auto" />
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-3 w-10 rounded skeleton-shimmer" />
      </div>
      {SERVICE_OPTIONS.map((service) => (
        <div key={service} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
          <div className="h-3.5 w-32 rounded skeleton-shimmer" />
          <div className="h-4 w-8 rounded-full skeleton-shimmer ml-auto" />
          <div className="h-3.5 w-6 rounded skeleton-shimmer" />
          <div className="h-3.5 w-6 rounded skeleton-shimmer" />
        </div>
      ))}
      <div className="flex items-center gap-4 px-4 py-3.5 bg-gray-50">
        <div className="h-3.5 w-14 rounded skeleton-shimmer" />
        <div className="h-3.5 w-6 rounded skeleton-shimmer ml-auto" />
        <div className="h-3.5 w-6 rounded skeleton-shimmer" />
        <div className="h-3.5 w-6 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
