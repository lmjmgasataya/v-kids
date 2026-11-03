import type { ReactNode } from "react";

// Chart fills. CHART_BLUE is a lighter step of kids-navy — navy itself is too dark to
// read as a fill next to magenta; this pair passes colorblind-separation checks.
export const CHART_BLUE = "#3463c4";
export const CHART_MAGENTA = "#a8408f";

function Tooltip({ children, align = "center" }: { children: ReactNode; align?: "center" | "right" }) {
  return (
    <span
      className={`pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100 transition-opacity absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-lg bg-kids-navy px-3 py-2 text-left text-xs font-medium text-white shadow-lg ${
        align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
      }`}
    >
      {children}
    </span>
  );
}

export function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

export interface ColumnDatum {
  key: string;
  label: string;
  value: number;
  tooltip: ReactNode;
  // Direct-label this column's value above it (keep to a few — e.g. the peak and the latest).
  showValue?: boolean;
  muted?: boolean;
}

// Vertical columns for a single series over time. Scrolls sideways inside its card
// when there are more columns than fit.
// Pass `max` to put several charts on the same scale.
export function ColumnChart({ data, height = 160, max: maxOverride }: { data: ColumnDatum[]; height?: number; max?: number }) {
  const max = maxOverride ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="overflow-x-auto">
      <div className="flex items-end gap-0.5 border-b border-gray-200" style={{ height: height + 20, minWidth: data.length * 30 }}>
        {data.map((d) => (
          <div
            key={d.key}
            tabIndex={0}
            className="group relative flex h-full flex-1 flex-col justify-end items-center outline-none"
          >
            <Tooltip>{d.tooltip}</Tooltip>
            {d.showValue && <span className="mb-0.5 text-[11px] font-semibold text-gray-700">{d.value}</span>}
            <div
              className="w-full max-w-8 rounded-t-[4px] transition-opacity group-hover:opacity-80"
              style={{
                height: `${(d.value / max) * height}px`,
                backgroundColor: CHART_BLUE,
                opacity: d.muted ? 0.45 : undefined,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-0.5 pt-1" style={{ minWidth: data.length * 30 }}>
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-[10px] leading-tight text-gray-500">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface BarDatum {
  key: string;
  label: string;
  value: number;
  tooltip?: ReactNode;
}

// Horizontal bars with the value at the end of each bar.
export function BarList({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-1.5">
      {data.map((d) => (
        <div key={d.key} tabIndex={0} className="group relative grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm outline-none">
          <span className="truncate text-gray-600">{d.label}</span>
          <div className="flex items-center gap-2">
            <div
              className="h-5 rounded-r-[4px] transition-opacity group-hover:opacity-80"
              style={{ width: `${(d.value / max) * 85}%`, minWidth: d.value > 0 ? 2 : 0, backgroundColor: CHART_BLUE }}
            />
            <span className="text-xs font-semibold text-gray-700">{d.value}</span>
          </div>
          {d.tooltip && <Tooltip align="right">{d.tooltip}</Tooltip>}
        </div>
      ))}
    </div>
  );
}

function Legend({ aLabel, bLabel }: { aLabel: string; bLabel: string }) {
  return (
    <div className="flex items-center gap-4 text-xs text-gray-600">
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_BLUE }} />
        {aLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_MAGENTA }} />
        {bLabel}
      </span>
    </div>
  );
}

export interface StackedColumnDatum {
  key: string;
  label: string;
  a: number; // bottom segment
  b: number; // top segment
  tooltip: ReactNode;
  showValue?: boolean;
}

// Vertical columns split into two stacked series, with a legend. The total is direct-labeled
// only where showValue is set.
export function StackedColumnChart({
  data,
  aLabel,
  bLabel,
  height = 160,
}: {
  data: StackedColumnDatum[];
  aLabel: string;
  bLabel: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.a + d.b));
  return (
    <div className="flex flex-col gap-3">
      <Legend aLabel={aLabel} bLabel={bLabel} />
      <div className="overflow-x-auto">
        <div className="flex items-end gap-0.5 border-b border-gray-200" style={{ height: height + 20, minWidth: data.length * 30 }}>
          {data.map((d) => (
            <div
              key={d.key}
              tabIndex={0}
              className="group relative flex h-full flex-1 flex-col justify-end items-center outline-none"
            >
              <Tooltip>{d.tooltip}</Tooltip>
              {d.showValue && <span className="mb-0.5 text-[11px] font-semibold text-gray-700">{d.a + d.b}</span>}
              <div className="flex w-full max-w-8 flex-col gap-0.5 transition-opacity group-hover:opacity-80">
                {d.b > 0 && (
                  <div className="rounded-t-[4px]" style={{ height: `${(d.b / max) * height}px`, backgroundColor: CHART_MAGENTA }} />
                )}
                {d.a > 0 && (
                  <div
                    className={d.b > 0 ? undefined : "rounded-t-[4px]"}
                    style={{ height: `${(d.a / max) * height}px`, backgroundColor: CHART_BLUE }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-0.5 pt-1" style={{ minWidth: data.length * 30 }}>
          {data.map((d) => (
            <span key={d.key} className="flex-1 text-center text-[10px] leading-tight text-gray-500">
              {d.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface SplitBarDatum {
  key: string;
  label: string;
  a: number;
  b: number;
}

// Horizontal stacked bars for two series (e.g. boys / girls), with a legend.
export function SplitBarList({
  data,
  aLabel,
  bLabel,
  wideLabels = false,
}: {
  data: SplitBarDatum[];
  aLabel: string;
  bLabel: string;
  wideLabels?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.a + d.b));
  return (
    <div className="flex flex-col gap-3">
      <Legend aLabel={aLabel} bLabel={bLabel} />
      <div className="flex flex-col gap-1.5">
        {data.map((d) => {
          const total = d.a + d.b;
          return (
            <div key={d.key} tabIndex={0} className={`group relative grid ${wideLabels ? "grid-cols-[8.5rem_1fr]" : "grid-cols-[3.5rem_1fr]"} items-center gap-3 text-sm outline-none`}>
              <span className="truncate text-gray-600">{d.label}</span>
              <div className="flex items-center gap-2">
                <div className="flex h-5 gap-0.5 transition-opacity group-hover:opacity-80" style={{ width: `${(total / max) * 85}%` }}>
                  {d.a > 0 && <div className="h-full" style={{ flex: d.a, backgroundColor: CHART_BLUE }} />}
                  {d.b > 0 && <div className="h-full rounded-r-[4px]" style={{ flex: d.b, backgroundColor: CHART_MAGENTA }} />}
                </div>
                <span className="text-xs font-semibold text-gray-700">{total}</span>
              </div>
              <Tooltip align="right">
                <span className="block font-semibold">{d.label}</span>
                <span className="block">
                  {aLabel}: {d.a}
                </span>
                <span className="block">
                  {bLabel}: {d.b}
                </span>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Share-of-total meter, e.g. "ID cards printed: 437 of 624".
export function ProgressMeter({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">
          {value} <span className="font-normal text-gray-400">/ {total}</span> · {pct}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CHART_BLUE }} />
      </div>
    </div>
  );
}

export function StatTile({
  value,
  label,
  hint,
  textClass,
}: {
  value: number | string;
  label: string;
  hint?: string;
  textClass: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${textClass}`}>{value}</span>
      <span className="text-xs font-semibold text-gray-500">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}
