ALTER TABLE "persons" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "preferred_name" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "ethnicity" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "religion" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "first_language" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "nhs_number" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "gp_name" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "gp_practice" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "allergies" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "medical_conditions" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "emergency_contacts" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "persons" ADD COLUMN "photo_url" text;--> statement-breakpoint
CREATE INDEX "persons_organisation_nhs_idx" ON "persons" USING btree ("organisation_id","nhs_number");