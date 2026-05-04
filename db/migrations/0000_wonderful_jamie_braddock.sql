CREATE TYPE "public"."base" AS ENUM('Main', 'Unaizah', 'Ar-Rass');--> statement-breakpoint
CREATE TYPE "public"."colledge" AS ENUM('CS', 'IT', 'COE');--> statement-breakpoint
CREATE TYPE "public"."section" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TABLE "project_participants" (
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"uni_id" varchar(9) NOT NULL,
	"x_url" varchar,
	"linked_url" varchar,
	"github_url" varchar,
	"email" varchar
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" varchar,
	"title" varchar(255) NOT NULL,
	"discription" varchar(10000),
	"supervisor" varchar(255),
	"is_public" boolean DEFAULT false,
	"section" "section",
	"colledge" "colledge",
	"base" "base",
	"project_external_link" varchar
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_participants" ADD CONSTRAINT "project_participants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;