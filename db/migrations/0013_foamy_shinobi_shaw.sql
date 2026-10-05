ALTER TABLE "votes" ADD COLUMN "voter_email" varchar(255);--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "ip_address" varchar(64);--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "device" varchar(100);