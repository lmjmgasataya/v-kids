"use client";

import { deleteServiceTeamMember } from "./actions";

export function DeleteServiceTeamMemberButton({ memberId, memberName }: { memberId: number; memberName: string }) {
  const deleteWithId = deleteServiceTeamMember.bind(null, memberId);

  return (
    <form
      action={deleteWithId}
      onSubmit={(e) => {
        if (!confirm(`Delete ${memberName}'s registration? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-red-600 hover:underline font-semibold">
        Delete
      </button>
    </form>
  );
}
