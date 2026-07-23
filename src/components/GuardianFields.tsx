import { Field, Select } from "@/components/form";
import { MOBILE_NUMBER_PATTERN, MOBILE_NUMBER_HELP } from "@/lib/constants";

export interface GuardianFieldsDefaults {
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
  gender?: "Male" | "Female";
}

export function GuardianFields({ defaultValues }: { defaultValues?: GuardianFieldsDefaults }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" name="guardianFirstName" required defaultValue={defaultValues?.firstName} />
        <Field label="Last name" name="guardianLastName" required defaultValue={defaultValues?.lastName} />
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
          defaultValue={defaultValues?.contactNumber}
        />
        <Select
          label="Gender"
          name="guardianGender"
          options={["Male", "Female"]}
          defaultValue={defaultValues?.gender}
        />
      </div>
    </>
  );
}
