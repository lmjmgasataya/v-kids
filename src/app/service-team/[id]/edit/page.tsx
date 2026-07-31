import { redirect, notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { serviceTeamMembers } from "@/db/schema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSignedPhotoUrl, isB2Configured } from "@/lib/storage";
import EditServiceTeamForm from "./EditServiceTeamForm";

export default async function EditServiceTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/service-team");

  const { id } = await params;
  const memberId = Number(id);
  if (!Number.isInteger(memberId)) notFound();

  const [row] = await db
    .select({
      id: serviceTeamMembers.id,
      firstName: serviceTeamMembers.firstName,
      lastName: serviceTeamMembers.lastName,
      nickname: serviceTeamMembers.nickname,
      gender: serviceTeamMembers.gender,
      birthday: serviceTeamMembers.birthday,
      serviceAttending: serviceTeamMembers.serviceAttending,
      photoKey: serviceTeamMembers.photoKey,
    })
    .from(serviceTeamMembers)
    .where(eq(serviceTeamMembers.id, memberId));

  if (!row) notFound();

  const photoUrl = row.photoKey ? await getSignedPhotoUrl(row.photoKey) : null;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Service Team", href: "/service-team" },
          { label: `${row.firstName} ${row.lastName}` },
        ]}
      />
      <EditServiceTeamForm member={row} photoUrl={photoUrl} photoEnabled={isB2Configured()} />
    </div>
  );
}
