CREATE TABLE "check_ins" (
	"id" serial PRIMARY KEY NOT NULL,
	"kid_id" integer NOT NULL,
	"service_attending" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"checked_out_at" timestamp,
	"remarks" text,
	"checked_in_by" integer,
	"checked_out_by" integer
);
--> statement-breakpoint
ALTER TABLE "kids" ADD COLUMN "qr_token" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_kid_id_kids_id_fk" FOREIGN KEY ("kid_id") REFERENCES "public"."kids"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_checked_out_by_users_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "check_ins_open_kid_idx" ON "check_ins" USING btree ("kid_id") WHERE "check_ins"."checked_out_at" is null;--> statement-breakpoint
ALTER TABLE "kids" ADD CONSTRAINT "kids_qr_token_unique" UNIQUE("qr_token");