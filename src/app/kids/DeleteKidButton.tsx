"use client";

import { deleteKid } from "./actions";

export function DeleteKidButton({ kidId, kidName }: { kidId: number; kidName: string }) {
  const deleteKidWithId = deleteKid.bind(null, kidId);

  return (
    <form
      action={deleteKidWithId}
      onSubmit={(e) => {
        if (!confirm(`Delete ${kidName}'s registration? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-red-600 hover:underline font-semibold">
        Delete
      </button>
    </form>
  );
}
