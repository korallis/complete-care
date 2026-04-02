ALTER TABLE "pathway_plans"
ADD COLUMN IF NOT EXISTS "person_id" uuid REFERENCES "persons"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "pathway_plans_person_idx"
  ON "pathway_plans" ("organisation_id", "person_id");
