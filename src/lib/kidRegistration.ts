import { and, eq, ilike, ne } from "drizzle-orm";
import { db } from "@/db";
import { kids } from "@/db/schema";
import { SERVICE_OPTIONS, MOBILE_NUMBER_REGEX } from "@/lib/constants";

export type Gender = "Male" | "Female";

export interface ChildInput {
  firstName: string;
  lastName: string;
  nickname: string;
  age: number;
  gender: Gender;
  serviceAttending: string;
}

export interface GuardianInput {
  firstName: string;
  lastName: string;
  contactNumber: string;
  gender: Gender;
}

export function readChildInput(formData: FormData): ChildInput {
  return {
    firstName: (formData.get("firstName") as string)?.trim() ?? "",
    lastName: (formData.get("lastName") as string)?.trim() ?? "",
    nickname: (formData.get("nickname") as string)?.trim() ?? "",
    age: Number(formData.get("age")),
    gender: formData.get("gender") as Gender,
    serviceAttending: (formData.get("serviceAttending") as string)?.trim() ?? "",
  };
}

export function readGuardianInput(formData: FormData): GuardianInput {
  return {
    firstName: (formData.get("guardianFirstName") as string)?.trim() ?? "",
    lastName: (formData.get("guardianLastName") as string)?.trim() ?? "",
    contactNumber: (formData.get("guardianContactNumber") as string)?.trim() ?? "",
    gender: formData.get("guardianGender") as Gender,
  };
}

export function validateChildInput(input: ChildInput): string | null {
  if (
    !input.firstName ||
    !input.lastName ||
    !Number.isFinite(input.age) ||
    input.age < 0 ||
    !input.gender ||
    !input.serviceAttending
  ) {
    return "Please fill in all required fields for the child.";
  }
  if (!SERVICE_OPTIONS.includes(input.serviceAttending)) {
    return "Please select a valid service.";
  }
  return null;
}

export function validateGuardianInput(input: GuardianInput): string | null {
  if (!input.firstName || !input.lastName || !input.contactNumber || !input.gender) {
    return "Please fill in all required guardian fields.";
  }
  if (!MOBILE_NUMBER_REGEX.test(input.contactNumber)) {
    return "Please enter a valid guardian mobile number.";
  }
  return null;
}

export async function isDuplicateKid(
  child: Pick<ChildInput, "firstName" | "lastName" | "age">,
  excludeKidId?: number
): Promise<boolean> {
  const conditions = [ilike(kids.firstName, child.firstName), ilike(kids.lastName, child.lastName), eq(kids.age, child.age)];
  if (excludeKidId !== undefined) {
    conditions.push(ne(kids.id, excludeKidId));
  }

  const [existing] = await db
    .select({ id: kids.id })
    .from(kids)
    .where(and(...conditions));

  return !!existing;
}
