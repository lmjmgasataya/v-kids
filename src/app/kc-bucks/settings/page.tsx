import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { kcBucksSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CHECKIN_CREDIT_SETTING_KEY } from "@/lib/constants";
import { Field } from "@/components/form";
import { SubmitButton } from "@/components/SubmitButton";
import { setCheckInCreditAmount } from "./actions";

export default async function KcBucksSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/");

  const [setting] = await db
    .select()
    .from(kcBucksSettings)
    .where(eq(kcBucksSettings.key, CHECKIN_CREDIT_SETTING_KEY));
  const amount = setting?.value ?? 0;

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "KC Bucks", href: "/kc-bucks" }, { label: "Credit Settings" }]} />
      <h2 className="text-3xl font-bold text-kids-navy font-[family-name:var(--font-fredoka)]">Credit Settings</h2>

      <form
        action={setCheckInCreditAmount}
        className="rounded-2xl border-2 border-kids-navy/20 bg-white p-6 flex flex-col gap-4"
      >
        <Field
          label="Credits per check-in"
          name="amount"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={amount}
          hint="Every time a kid checks in, they'll earn this many KC Bucks. Set to 0 to turn this off."
        />
        <SubmitButton
          label="Save"
          pendingLabel="Saving…"
          className="self-start bg-kids-navy hover:bg-kids-navy/90 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition"
        />
      </form>
    </div>
  );
}
