import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExpiredLinkNotice } from "@/components/ExpiredLinkNotice";
import { getValidRegistrationLink } from "@/lib/registrationLinks";
import RegisterForm from "../../RegisterForm";

export default async function RegisterChildLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await getValidRegistrationLink("child", token);

  if (!link) return <ExpiredLinkNotice />;

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Register", href: "/register" }, { label: "Register a Child" }]}
      />
      <RegisterForm />
    </div>
  );
}
