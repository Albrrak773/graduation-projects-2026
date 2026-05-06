CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"sent" integer NOT NULL,
	"failed" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
