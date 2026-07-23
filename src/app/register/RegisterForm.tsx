"use client";

import { useActionState } from "react";
import { registerKid } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { SERVICE_OPTIONS, MOBILE_NUMBER_PATTERN, MOBILE_NUMBER_HELP } from "@/lib/constants";

const inputCls =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kids-navy/40 focus:border-transparent";

function Field({
  label,
  name,
  required,
  hint,
  ...props
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input name={name} required={required} className={inputCls} {...props} />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: readonly string[] }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <select name={name} required defaultValue="" className={inputCls}>
        <option value="" disabled>
          Select…
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function RegisterForm() {
  const [state, action] = useActionState(registerKid, undefined);

  return (
    <form action={action} className="flex flex-col gap-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">
          Register a Child
        </h2>
        <p className="text-sm text-gray-500 mt-1">Fill in the child&apos;s and guardian&apos;s details below.</p>
      </div>

      <fieldset className="rounded-2xl border-2 border-kids-magenta/30 bg-kids-magenta/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-magenta uppercase tracking-wide">Child</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="firstName" required />
          <Field label="Last name" name="lastName" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nickname" name="nickname" />
          <Field label="Age" name="age" type="number" min={0} max={17} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Gender" name="gender" options={["Male", "Female"]} />
          <Select label="Service attending" name="serviceAttending" options={SERVICE_OPTIONS} />
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border-2 border-kids-navy/30 bg-kids-navy/5 p-6 flex flex-col gap-4">
        <legend className="px-2 text-sm font-bold text-kids-navy uppercase tracking-wide">Guardian</legend>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" name="guardianFirstName" required />
          <Field label="Last name" name="guardianLastName" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Contact number"
            name="guardianContactNumber"
            type="tel"
            placeholder="09XXXXXXXXX"
            pattern={MOBILE_NUMBER_PATTERN}
            title={MOBILE_NUMBER_HELP}
            hint={MOBILE_NUMBER_HELP}
            required
          />
          <Select label="Gender" name="guardianGender" options={["Male", "Female"]} />
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
