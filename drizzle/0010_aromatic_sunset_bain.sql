ALTER TABLE "care_notes" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "shift" text;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "mood" text;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "personal_care" jsonb;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "nutrition" jsonb;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "mobility" text;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "health" text;--> statement-breakpoint
ALTER TABLE "care_notes" ADD COLUMN "handover" text;--> statement-breakpoint
CREATE INDEX "care_notes_organisation_shift_idx" ON "care_notes" USING btree ("organisation_id","shift");--> statement-breakpoint
CREATE INDEX "care_notes_organisation_author_idx" ON "care_notes" USING btree ("organisation_id","author_id");