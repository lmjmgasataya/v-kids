import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kids, guardians } from "@/db/schema";
import { eq } from "drizzle-orm";
import EditKidForm from "./EditKidForm";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default async function EditKidPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const kidId = Number(id);
  if (!Number.isInteger(kidId)) notFound();

  const [row] = await db
    .select({
      id: kids.id,
      firstName: kids.firstName,
      lastName: kids.lastName,
      nickname: kids.nickname,
      age: kids.age,
      gender: kids.gender,
      serviceAttending: kids.serviceAttending,
      guardianFirstName: guardians.firstName,
      guardianLastName: guardians.lastName,
      guardianContactNumber: guardians.contactNumber,
      guardianGender: guardians.gender,
    })
    .from(kids)
    .innerJoin(guardians, eq(kids.guardianId, guardians.id))
    .where(eq(kids.id, kidId));

  if (!row) notFound();

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Registered Kids", href: "/kids" },
          { label: `${row.firstName} ${row.lastName}` },
        ]}
      />
      <EditKidForm kid={row} />
    </div>
  );
}
