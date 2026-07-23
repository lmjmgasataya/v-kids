CREATE TYPE "public"."kc_bucks_transaction_type" AS ENUM('checkin', 'grant', 'redemption');--> statement-breakpoint
CREATE TABLE "kc_bucks_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kc_bucks_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"type" "kc_bucks_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"check_in_id" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kc_bucks_transactions" ADD CONSTRAINT "kc_bucks_transactions_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kc_bucks_transactions" ADD CONSTRAINT "kc_bucks_transactions_check_in_id_check_ins_id_fk" FOREIGN KEY ("check_in_id") REFERENCES "public"."check_ins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kc_bucks_transactions" ADD CONSTRAINT "kc_bucks_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;