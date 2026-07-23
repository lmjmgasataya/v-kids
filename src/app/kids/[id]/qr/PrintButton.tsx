"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden bg-kids-navy hover:bg-kids-navy/90 text-white font-bold px-6 py-2.5 rounded-xl transition"
    >
      Print badge
    </button>
  );
}
