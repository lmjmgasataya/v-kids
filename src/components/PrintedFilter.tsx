"use client";

export type PrintedFilterValue = "unprinted" | "printed" | "all";

const OPTIONS: { key: PrintedFilterValue; label: string }[] = [
  { key: "unprinted", label: "Not yet printed" },
  { key: "printed", label: "Printed" },
  { key: "all", label: "Show all" },
];

export function matchesPrintedFilter(idPrinted: boolean, filter: PrintedFilterValue): boolean {
  if (filter === "unprinted") return !idPrinted;
  if (filter === "printed") return idPrinted;
  return true;
}

export function PrintedFilter({
  value,
  onChange,
  counts,
}: {
  value: PrintedFilterValue;
  onChange: (value: PrintedFilterValue) => void;
  counts: Record<PrintedFilterValue, number>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition ${
            option.key === value
              ? "bg-kids-green text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          {option.label} ({counts[option.key]})
        </button>
      ))}
    </div>
  );
}
