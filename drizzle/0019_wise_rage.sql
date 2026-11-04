CREATE TABLE "service_team_check_ins" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"service_attending" text NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"checked_out_at" timestamp,
	"remarks" text,
	"checked_in_by" integer,
	"checked_out_by" integer
);
--> statement-breakpoint
ALTER TABLE "service_team_check_ins" ADD CONSTRAINT "service_team_check_ins_member_id_service_team_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."service_team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_team_check_ins" ADD CONSTRAINT "service_team_check_ins_checked_in_by_users_id_fk" FOREIGN KEY ("checked_in_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_team_check_ins" ADD CONSTRAINT "service_team_check_ins_checked_out_by_users_id_fk" FOREIGN KEY ("checked_out_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "service_team_check_ins_open_member_idx" ON "service_team_check_ins" USING btree ("member_id") WHERE "service_team_check_ins"."checked_out_at" is null;--> statement-breakpoint
CREATE INDEX "service_team_check_ins_service_checked_in_idx" ON "service_team_check_ins" USING btree ("service_attending","checked_in_at");