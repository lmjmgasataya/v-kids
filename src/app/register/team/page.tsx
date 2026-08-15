import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { isB2Configured } from "@/lib/storage";
import TeamRegisterForm from "./TeamRegisterForm";

export default async function RegisterTeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Register", href: "/register" },
          { label: "Register a Service Team Member" },
        ]}
      />
      <TeamRegisterForm photoEnabled={isB2Configured()} />
    </div>
  );
}
