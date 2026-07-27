import { Breadcrumbs } from "@/components/Breadcrumbs";
import TeamRegisterForm from "./TeamRegisterForm";

export default function RegisterTeamPage() {
  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Register", href: "/register" },
          { label: "Register a Service Team Member" },
        ]}
      />
      <TeamRegisterForm />
    </div>
  );
}
