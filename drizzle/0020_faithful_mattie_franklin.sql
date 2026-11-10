CREATE TABLE "kid_duplicate_dismissals" (
	"kid_a_id" integer NOT NULL,
	"kid_b_id" integer NOT NULL,
	"dismissed_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kid_duplicate_dismissals_kid_a_id_kid_b_id_pk" PRIMARY KEY("kid_a_id","kid_b_id")
);
--> statement-breakpoint
ALTER TABLE "kid_duplicate_dismissals" ADD CONSTRAINT "kid_duplicate_dismissals_kid_a_id_kids_id_fk" FOREIGN KEY ("kid_a_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_duplicate_dismissals" ADD CONSTRAINT "kid_duplicate_dismissals_kid_b_id_kids_id_fk" FOREIGN KEY ("kid_b_id") REFERENCES "public"."kids"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kid_duplicate_dismissals" ADD CONSTRAINT "kid_duplicate_dismissals_dismissed_by_users_id_fk" FOREIGN KEY ("dismissed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kid_duplicate_dismissals_kid_b_idx" ON "kid_duplicate_dismissals" USING btree ("kid_b_id");