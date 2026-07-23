import { Breadcrumbs } from "@/components/Breadcrumbs";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Register" }]} />
      <RegisterForm />
    </div>
  );
}
