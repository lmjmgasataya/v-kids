"use client";

import { deleteFlag } from "./actions";

export function DeleteFlagButton({ flagKey }: { flagKey: string }) {
  const deleteFlagWithKey = deleteFlag.bind(null, flagKey);

  return (
    <form
      action={deleteFlagWithKey}
      onSubmit={(e) => {
        if (!confirm(`Delete flag "${flagKey}"? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-red-600 hover:underline text-sm font-semibold">
        Delete
      </button>
    </form>
  );
}
