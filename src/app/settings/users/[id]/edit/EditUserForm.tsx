"use client";

import { useActionState } from "react";
import { updateUser } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { UserFields } from "@/components/UserFields";
import { useToastOnResult } from "@/components/toast/useToastOnResult";
import type { Role } from "@/lib/auth";

interface UserRow {
  id: number;
  username: string;
  name: string;
  role: Role;
}

export default function EditUserForm({ user }: { user: UserRow }) {
  const updateUserWithId = updateUser.bind(null, user.id);
  const [state, action] = useActionState(updateUserWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Edit User</h2>
        <p className="text-sm text-gray-500 mt-1">Update {user.username}&apos;s account.</p>
      </div>

      <fieldset className="rounded-2xl border-2 border-kids-navy/30 bg-kids-navy/5 p-6 flex flex-col gap-4">
        <UserFields
          defaultValues={{ username: user.username, name: user.name, role: user.role }}
          passwordRequired={false}
        />
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <SubmitButton
        label="Save changes"
        pendingLabel="Saving…"
        className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white text-base font-bold py-3 rounded-xl transition font-[family-name:var(--font-fredoka)]"
      />
    </form>
  );
}
