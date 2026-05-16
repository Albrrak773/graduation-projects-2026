CREATE TYPE "public"."degree" AS ENUM('bachelor', 'master');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "degree" "degree" DEFAULT 'bachelor' NOT NULL;