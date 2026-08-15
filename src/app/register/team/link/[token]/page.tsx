import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExpiredLinkNotice } from "@/components/ExpiredLinkNotice";
import { getValidRegistrationLink } from "@/lib/registrationLinks";
import { isB2Configured } from "@/lib/storage";
import TeamRegisterForm from "../../TeamRegisterForm";

export default async function RegisterTeamLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidRegistrationLink("team", token);

  if (!link) return <ExpiredLinkNotice />;

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
