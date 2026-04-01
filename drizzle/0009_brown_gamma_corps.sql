CREATE TABLE "care_plan_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"care_plan_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by_id" uuid,
	"created_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "template" text;--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "review_frequency" text DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "approved_by_id" uuid;--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "approved_at" timestamp;--> statement-breakpoint
ALTER TABLE "care_plans" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "care_plan_versions" ADD CONSTRAINT "care_plan_versions_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_versions" ADD CONSTRAINT "care_plan_versions_care_plan_id_care_plans_id_fk" FOREIGN KEY ("care_plan_id") REFERENCES "public"."care_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plan_versions" ADD CONSTRAINT "care_plan_versions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "care_plan_versions_plan_idx" ON "care_plan_versions" USING btree ("care_plan_id","version_number");--> statement-breakpoint
CREATE INDEX "care_plan_versions_org_idx" ON "care_plan_versions" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "care_plan_versions_org_plan_idx" ON "care_plan_versions" USING btree ("organisation_id","care_plan_id");--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "care_plans_organisation_review_date_idx" ON "care_plans" USING btree ("organisation_id","next_review_date");