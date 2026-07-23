"use client";

import { useActionState } from "react";
import { updateKid } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { ChildFields } from "@/components/ChildFields";
import { GuardianFields } from "@/components/GuardianFields";

interface KidWithGuardian {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  age: number;
  gender: "Male" | "Female";
  serviceAttending: string;
  guardianFirstName: string;
  guardianLastName: string;
  guardianContactNumber: string;
  guardianGender: "Male" | "Female";
}

export default function EditKidForm({ kid }: { kid: KidWithGuardian }) {
  const updateKidWithId = updateKid.bind(null, kid.id);
  const [state, action] = useActionState(updateKidWithId, undefined);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Edit Registration
        </h2>
        <p className="text-sm text-gray-500 mt-1">Update the child&apos;s and guardian&apos;s details below.</p>
      </div>

      <fieldset className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-magenta uppercase tracking-wide">Child</legend>
        <ChildFields
          defaultValues={{
            firstName: kid.firstName,
            lastName: kid.lastName,
            nickname: kid.nickname ?? "",
            age: kid.age,
            gender: kid.gender,
            serviceAttending: kid.serviceAttending,
          }}
        />
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-kids-navy/30 bg-kids-navy/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-navy uppercase tracking-wide">Guardian</legend>
        <GuardianFields
          defaultValues={{
            firstName: kid.guardianFirstName,
            lastName: kid.guardianLastName,
            contactNumber: kid.guardianContactNumber,
            gender: kid.guardianGender,
          }}
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
