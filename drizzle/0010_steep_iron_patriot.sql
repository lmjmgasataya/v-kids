CREATE TYPE "public"."registration_form_type" AS ENUM('child', 'team');--> statement-breakpoint
CREATE TABLE "registration_links" (
	"form_type" "registration_form_type" PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "registration_links_token_unique" UNIQUE("token")
);
