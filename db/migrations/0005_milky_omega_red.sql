ALTER TABLE "project_participants" RENAME COLUMN "email" TO "personal_email";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "signature" varchar(60);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_signature_unique" UNIQUE("signature");