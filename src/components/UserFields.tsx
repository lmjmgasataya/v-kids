import { Field, Select } from "@/components/form";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Role } from "@/lib/auth";

export interface UserFieldsDefaults {
  username?: string;
  name?: string;
  role?: Role;
}

export function UserFields({
  defaultValues,
  passwordRequired,
}: {
  defaultValues?: UserFieldsDefaults;
  passwordRequired: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Username" name="username" required defaultValue={defaultValues?.username} />
        <Field label="Full name" name="name" required defaultValue={defaultValues?.name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Role" name="role" options={ROLE_OPTIONS} defaultValue={defaultValues?.role} />
        <Field
          label={passwordRequired ? "Password" : "New password"}
          name="password"
          type="password"
          required={passwordRequired}
          hint={passwordRequired ? "At least 6 characters." : "Leave blank to keep the current password."}
        />
      </div>
    </>
  );
}
