"use client";

import { deleteKid } from "./actions";

export function DeleteKidButton({
  kidId,
  kidName,
  returnTo = "/kids",
}: {
  kidId: number;
  kidName: string;
  returnTo?: "/kids" | "/kids/duplicates";
}) {
  const deleteKidWithId = deleteKid.bind(null, kidId, returnTo);

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
