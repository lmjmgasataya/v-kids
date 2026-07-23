import { ROLE_OPTIONS } from "@/lib/constants";
import type { Role } from "@/lib/auth";

export interface UserInput {
  username: string;
  name: string;
  role: Role;
  password: string;
}

export function readUserInput(formData: FormData): UserInput {
  return {
    username: (formData.get("username") as string)?.trim() ?? "",
    name: (formData.get("name") as string)?.trim() ?? "",
    role: formData.get("role") as Role,
    password: (formData.get("password") as string) ?? "",
  };
}

export function validateUserInput(input: UserInput, { passwordRequired }: { passwordRequired: boolean }): string | null {
  if (!input.username || !input.name || !input.role) {
    return "Please fill in all required fields.";
  }
  if (!ROLE_OPTIONS.includes(input.role)) {
    return "Please select a valid role.";
  }
  if (passwordRequired && !input.password) {
    return "Please set a password.";
  }
  if (input.password && input.password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}
