ALTER TABLE "service_team_members" ALTER COLUMN "id_card_photo_scale" SET DEFAULT 30;--> statement-breakpoint
-- Move members still on the old 22% default up to the new one; anyone set to another size keeps it.
UPDATE "service_team_members" SET "id_card_photo_scale" = 30 WHERE "id_card_photo_scale" = 22;