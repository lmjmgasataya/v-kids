import Link from "next/link";
import { capitalizeName } from "@/lib/format";

// A kid's name linking to their edit page when the viewer may edit kids, otherwise to a
// /kids search for them.
export function KidLink({
  kid,
  canEdit,
}: {
  kid: { id: number; firstName: string; lastName: string; nickname: string | null };
  canEdit: boolean;
}) {
  const href = canEdit ? `/kids/${kid.id}/edit` : `/kids?q=${encodeURIComponent(`${kid.firstName} ${kid.lastName}`)}`;
  return (
    <>
      <Link href={href} className="font-medium text-kids-navy hover:underline">
        {capitalizeName(kid.firstName)} {capitalizeName(kid.lastName)}
      </Link>
      {kid.nickname && <span className="text-gray-400"> ({capitalizeName(kid.nickname)})</span>}
    </>
  );
}
