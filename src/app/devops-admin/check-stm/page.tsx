import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CheckStmWorkspace } from "./CheckStmWorkspace";

export default async function CheckStmPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  return <CheckStmWorkspace />;
}
