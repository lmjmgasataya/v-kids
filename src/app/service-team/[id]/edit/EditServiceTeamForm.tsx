"use client";

import { useActionState } from "react";
import { updateServiceTeamMember } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Select } from "@/components/form";
import { PhotoCapture } from "@/components/PhotoCapture";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

interface Member {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string | null;
  gender: string | null;
  birthday: string;
  serviceAttending: string;
}

export default function EditServiceTeamForm({
  member,
  photoUrl,
  photoEnabled,
}: {
  member: Member;
  photoUrl: string | null;
  photoEnabled: boolean;
}) {
  const updateWithId = updateServiceTeamMember.bind(null, member.id);
  const [state, action] = useActionState(updateWithId, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Edit Service Team Member
        </h2>
        <p className="text-sm text-gray-500 mt-1">Update their details, or retake their photo below.</p>
      </div>

      <fieldset className="rounded-2xl border-2 border-kids-navy/30 bg-kids-navy/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-navy uppercase tracking-wide">Details</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="firstName" required defaultValue={member.firstName} />
          <Field label="Last name" name="lastName" required defaultValue={member.lastName} />
        </div>
        <Field label="Nickname" name="nickname" defaultValue={member.nickname ?? undefined} />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Birthday" name="birthday" type="date" required defaultValue={member.birthday} />
          <Select label="Gender" name="gender" options={["Male", "Female"]} defaultValue={member.gender ?? undefined} />
        </div>
        <Select
          label="Time of service"
          name="serviceAttending"
          options={SERVICE_OPTIONS}
          defaultValue={member.serviceAttending}
        />
        {photoEnabled ? (
          <PhotoCapture name="photo" initialPreviewUrl={photoUrl} />
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-4 text-center text-sm text-gray-400">
            Photo capture is currently unavailable.
          </div>
        )}
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
