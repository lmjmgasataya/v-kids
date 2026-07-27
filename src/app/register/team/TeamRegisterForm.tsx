"use client";

import { useActionState } from "react";
import { registerServiceTeamMember } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { Field, Select } from "@/components/form";
import { SERVICE_OPTIONS } from "@/lib/constants";
import { useToastOnResult } from "@/components/toast/useToastOnResult";

export default function TeamRegisterForm() {
  const [state, action] = useActionState(registerServiceTeamMember, undefined);
  useToastOnResult(state);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Register a Service Team Member
        </h2>
        <p className="text-sm text-gray-500 mt-1">Fill in your details and add a photo below.</p>
      </div>

      <fieldset className="rounded-2xl border-2 border-kids-navy/30 bg-kids-navy/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-navy uppercase tracking-wide">Details</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="firstName" required defaultValue={state?.values?.firstName} />
          <Field label="Last name" name="lastName" required defaultValue={state?.values?.lastName} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Birthday" name="birthday" type="date" required defaultValue={state?.values?.birthday} />
          <Select
            label="Time of service"
            name="serviceAttending"
            options={SERVICE_OPTIONS}
            defaultValue={state?.values?.serviceAttending}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Photo <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="photo"
            accept="image/*"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-kids-navy file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
          />
          <p className="text-xs text-gray-400 mt-1">Upload a photo from your device.</p>
        </div>
      </fieldset>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      )}

      <SubmitButton
        label="Register"
        pendingLabel="Registering…"
        className="bg-kids-green hover:bg-kids-green/90 disabled:opacity-50 text-white text-base font-bold py-3 rounded-xl transition font-[family-name:var(--font-fredoka)]"
      />
    </form>
  );
}
