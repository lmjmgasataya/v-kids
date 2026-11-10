"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { kidDuplicateDismissals } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { withToast } from "@/lib/toast";
import { canManageKids } from "../permissions";
import { duplicatesHref, parseDuplicateView } from "./view";

function orderedPair([a, b]: [number, number]): { kidAId: number; kidBId: number } | null {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a === b) return null;
  return a < b ? { kidAId: a, kidBId: b } : { kidAId: b, kidBId: a };
}

/** Marks every given pair as "Not duplicates" so they stop showing on /kids/duplicates. */
export async function dismissDuplicatePairs(pairs: [number, number][], view: string) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await canManageKids(session))) redirect("/kids/duplicates");

  const rows = pairs.map(orderedPair).filter((p) => p !== null);
  if (rows.length > 0) {
    await db
      .insert(kidDuplicateDismissals)
      .values(rows.map((r) => ({ ...r, dismissedBy: session.userId })))
      .onConflictDoNothing();
  }

  revalidatePath("/kids/duplicates");
  redirect(withToast(duplicatesHref(parseDuplicateView(view)), "success", "Hidden — marked as not duplicates."));
}

/** Undoes a "Not duplicates" so the pair is suggested again. */
export async function restoreDuplicatePair(aId: number, bId: number) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await canManageKids(session))) redirect("/kids/duplicates");

  const pair = orderedPair([aId, bId]);
  if (pair) {
    await db
      .delete(kidDuplicateDismissals)
      .where(and(eq(kidDuplicateDismissals.kidAId, pair.kidAId), eq(kidDuplicateDismissals.kidBId, pair.kidBId)));
  }

  revalidatePath("/kids/duplicates");
  redirect(withToast(duplicatesHref("hidden"), "success", "Restored — this pair will be suggested again."));
}
