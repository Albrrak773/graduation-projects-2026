CREATE TABLE "voting_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"show_vote_button" boolean DEFAULT true NOT NULL,
	"max_votes_per_user" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "votes_user_project_unique";
--> statement-breakpoint
INSERT INTO "voting_campaigns" ("id", "name", "starts_at", "ends_at", "show_vote_button", "max_votes_per_user")
VALUES (
	'00000000-0000-0000-0000-000000000000',
	'Legacy Campaign',
	'2020-01-01 00:00:00',
	NOW(),
	false,
	1
);
--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "campaign_id" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_campaign_id_voting_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."voting_campaigns"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "campaign_id" DROP DEFAULT;
--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_project_campaign_unique" ON "votes" USING btree ("user_id","project_id","campaign_id");