"use client";

import { deleteUser } from "./actions";

export function DeleteUserButton({ userId, username }: { userId: number; username: string }) {
  const deleteUserWithId = deleteUser.bind(null, userId);

  return (
    <form
      action={deleteUserWithId}
      onSubmit={(e) => {
        if (!confirm(`Delete ${username}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <button type="submit" className="text-red-600 hover:underline text-sm font-semibold">
        Delete
      </button>
    </form>
  );
}
