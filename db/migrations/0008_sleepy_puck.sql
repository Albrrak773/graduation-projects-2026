ALTER TABLE "admins" DROP CONSTRAINT "admins_user_id_unique";--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "password_hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_email_unique" UNIQUE("email");