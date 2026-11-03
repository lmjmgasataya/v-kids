import Link from "next/link";
import { REPORT_RANGES, type ReportRange } from "@/lib/reports";

// Links rather than a form so each range is a shareable URL; "all" drops the param.
export function RangePicker({ basePath, range }: { basePath: string; range: ReportRange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-500">Check-ins from:</span>
      {REPORT_RANGES.map((r) => (
        <Link
          key={r.key}
          href={r.key === "all" ? basePath : `${basePath}?range=${r.key}`}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
            r.key === range ? "bg-kids-green text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
