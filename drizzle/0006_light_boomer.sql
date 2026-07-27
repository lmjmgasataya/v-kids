CREATE TABLE "service_team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"birthday" date NOT NULL,
	"service_attending" text NOT NULL,
	"photo_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
