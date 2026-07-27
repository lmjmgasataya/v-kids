import { Breadcrumbs } from "@/components/Breadcrumbs";
import RegisterForm from "./RegisterForm";

export default function RegisterChildPage() {
  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Register", href: "/register" }, { label: "Register a Child" }]}
      />
      <RegisterForm />
    </div>
  );
}
