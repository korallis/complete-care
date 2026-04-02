ALTER TABLE "care_notes"
ADD COLUMN IF NOT EXISTS "children_home_details" jsonb;

CREATE TABLE IF NOT EXISTS "childrens_meetings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "person_id" uuid NOT NULL REFERENCES "persons"("id") ON DELETE cascade,
  "meeting_date" text NOT NULL,
  "title" text NOT NULL,
  "child_attendees" jsonb DEFAULT '[]'::jsonb,
  "staff_attendees" jsonb DEFAULT '[]'::jsonb,
  "agenda_items" jsonb DEFAULT '[]'::jsonb,
  "discussion_points" text NOT NULL,
  "decisions" text NOT NULL,
  "actions" jsonb DEFAULT '[]'::jsonb,
  "shared_with_reg44" boolean DEFAULT true NOT NULL,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "childrens_meetings_org_idx"
  ON "childrens_meetings" ("organisation_id");
CREATE INDEX IF NOT EXISTS "childrens_meetings_org_person_idx"
  ON "childrens_meetings" ("organisation_id", "person_id");
CREATE INDEX IF NOT EXISTS "childrens_meetings_org_date_idx"
  ON "childrens_meetings" ("organisation_id", "meeting_date");

CREATE TABLE IF NOT EXISTS "childrens_complaints" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organisation_id" uuid NOT NULL REFERENCES "organisations"("id") ON DELETE cascade,
  "person_id" uuid NOT NULL REFERENCES "persons"("id") ON DELETE cascade,
  "complaint_date" text NOT NULL,
  "raised_by" text NOT NULL,
  "nature" text NOT NULL,
  "desired_outcome" text,
  "status" text DEFAULT 'received' NOT NULL,
  "advocacy_offered" boolean DEFAULT false NOT NULL,
  "advocacy_notes" text,
  "investigation_notes" text,
  "outcome_summary" text,
  "satisfaction" text,
  "created_by_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "childrens_complaints_org_idx"
  ON "childrens_complaints" ("organisation_id");
CREATE INDEX IF NOT EXISTS "childrens_complaints_org_person_idx"
  ON "childrens_complaints" ("organisation_id", "person_id");
CREATE INDEX IF NOT EXISTS "childrens_complaints_org_status_idx"
  ON "childrens_complaints" ("organisation_id", "status");
