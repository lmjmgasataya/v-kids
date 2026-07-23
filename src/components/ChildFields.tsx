import { Field, Select } from "@/components/form";
import { SERVICE_OPTIONS } from "@/lib/constants";

export interface ChildFieldsDefaults {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  age?: number;
  gender?: "Male" | "Female";
  serviceAttending?: string;
}

export function ChildFields({ defaultValues }: { defaultValues?: ChildFieldsDefaults }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="First name" name="firstName" required defaultValue={defaultValues?.firstName} />
        <Field label="Last name" name="lastName" required defaultValue={defaultValues?.lastName} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nickname" name="nickname" defaultValue={defaultValues?.nickname} />
        <Field label="Age" name="age" type="number" min={0} max={17} required defaultValue={defaultValues?.age} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Gender" name="gender" options={["Male", "Female"]} defaultValue={defaultValues?.gender} />
        <Select
          label="Service attending"
          name="serviceAttending"
          options={SERVICE_OPTIONS}
          defaultValue={defaultValues?.serviceAttending}
        />
      </div>
    </>
  );
}
