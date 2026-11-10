CREATE INDEX "check_ins_kid_idx" ON "check_ins" USING btree ("kid_id");--> statement-breakpoint
CREATE INDEX "kc_bucks_transactions_created_idx" ON "kc_bucks_transactions" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "kc_bucks_transactions_type_created_idx" ON "kc_bucks_transactions" USING btree ("type","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "service_team_check_ins_checked_in_idx" ON "service_team_check_ins" USING btree ("checked_in_at");