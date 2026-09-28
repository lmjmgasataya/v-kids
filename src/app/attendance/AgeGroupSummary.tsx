"use client";

import { useEffect, useState } from "react";

interface AgeBracket {
  label: string;
  min: number;
  max: number;
}

export interface ServiceAges {
  service: string;
  ages: number[];
}

// Placeholder brackets — editable in the UI until the ministry settles on the
// real cutoffs. Edits are remembered per browser only.
const DEFAULT_BRACKETS: AgeBracket[] = [
  { label: "Small Kids", min: 4, max: 6 },
  { label: "Big Kids", min: 7, max: 12 },
  { label: "Preteens", min: 12, max: 13 },
];

const STORAGE_KEY = "attendance-age-brackets";

function loadBrackets(): AgeBracket[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_BRACKETS.length &&
      parsed.every((b) => typeof b?.label === "string" && Number.isFinite(b?.min) && Number.isFinite(b?.max))
    ) {
      return parsed;
    }
  } catch {}
  return null;
}

function saveBrackets(brackets: AgeBracket[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brackets));
  } catch {}
}

// Each kid counts toward the first bracket their age falls in, so overlapping
// ranges (e.g. 12 in both Big Kids and Preteens) never double-count.
function bracketIndexFor(age: number, brackets: AgeBracket[]): number {
  return brackets.findIndex((b) => age >= b.min && age <= b.max);
}

export function AgeGroupSummary({ services }: { services: ServiceAges[] }) {
  const [brackets, setBrackets] = useState<AgeBracket[]>(DEFAULT_BRACKETS);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const stored = loadBrackets();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    if (stored) setBrackets(stored);
  }, []);

  function updateBracket(index: number, patch: Partial<AgeBracket>) {
    const next = brackets.map((b, i) => (i === index ? { ...b, ...patch } : b));
    setBrackets(next);
    saveBrackets(next);
  }

  function resetBrackets() {
    setBrackets(DEFAULT_BRACKETS);
    saveBrackets(DEFAULT_BRACKETS);
  }

  const rows = services.map((s) => {
    const counts = brackets.map(() => 0);
    let other = 0;
    for (const age of s.ages) {
      const i = bracketIndexFor(age, brackets);
      if (i === -1) other++;
      else counts[i]++;
    }
    return { service: s.service, counts, other, total: s.ages.length };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      counts: acc.counts.map((c, i) => c + r.counts[i]),
      other: acc.other + r.other,
      total: acc.total + r.total,
    }),
    { counts: brackets.map(() => 0), other: 0, total: 0 }
  );
  const showOther = totals.other > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">By age group</h3>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
        >
          {editing ? "Done" : "Edit age ranges"}
        </button>
      </div>

      {editing && (
        <div className="rounded-2xl border-2 border-kids-navy/20 bg-white p-4 flex flex-col gap-3">
          {brackets.map((b, i) => (
            <div key={i} className="flex items-center gap-2 flex-wrap text-sm">
              <input
                type="text"
                value={b.label}
                onChange={(e) => updateBracket(i, { label: e.target.value })}
                className="w-36 px-2 py-1.5 rounded-lg border-2 border-gray-200 font-medium text-gray-800"
              />
              <span className="text-gray-500">ages</span>
              <input
                type="number"
                min={0}
                value={b.min}
                onChange={(e) => updateBracket(i, { min: Number(e.target.value) })}
                className="w-16 px-2 py-1.5 rounded-lg border-2 border-gray-200 text-gray-800"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                min={0}
                value={b.max}
                onChange={(e) => updateBracket(i, { max: Number(e.target.value) })}
                className="w-16 px-2 py-1.5 rounded-lg border-2 border-gray-200 text-gray-800"
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-gray-500">
              If ranges overlap, a kid counts in the first matching group. Saved on this device only.
            </p>
            <button
              type="button"
              onClick={resetBrackets}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-kids-magenta hover:bg-kids-magenta/10 transition"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
              {brackets.map((b, i) => (
                <th key={i} className="px-4 py-3 text-right font-semibold text-gray-600 whitespace-nowrap">
                  {b.label}
                  <span className="block text-xs font-normal text-gray-400">
                    {b.min}–{b.max} yrs
                  </span>
                </th>
              ))}
              {showOther && <th className="px-4 py-3 text-right font-semibold text-gray-600">Other ages</th>}
              <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.service} className="border-b border-gray-100 last:border-0 hover:bg-kids-yellow/5">
                <td className="px-4 py-3 font-medium text-gray-900">{r.service}</td>
                {r.counts.map((c, i) => (
                  <td key={i} className={`px-4 py-3 text-right ${c > 0 ? "text-gray-900" : "text-gray-300"}`}>
                    {c}
                  </td>
                ))}
                {showOther && (
                  <td className={`px-4 py-3 text-right ${r.other > 0 ? "text-gray-500" : "text-gray-300"}`}>
                    {r.other}
                  </td>
                )}
                <td className="px-4 py-3 text-right text-gray-900">{r.total}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold text-gray-900">
              <td className="px-4 py-3">Total</td>
              {totals.counts.map((c, i) => (
                <td key={i} className="px-4 py-3 text-right">
                  {c}
                </td>
              ))}
              {showOther && <td className="px-4 py-3 text-right">{totals.other}</td>}
              <td className="px-4 py-3 text-right">{totals.total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
