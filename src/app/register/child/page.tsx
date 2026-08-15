import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import RegisterForm from "./RegisterForm";

export default async function RegisterChildPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Register", href: "/register" }, { label: "Register a Child" }]}
      />
      <RegisterForm />
    </div>
  );
}
