CREATE TABLE "persons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"type" text DEFAULT 'resident' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"date_of_birth" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "staff_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"user_id" uuid,
	"full_name" text NOT NULL,
	"job_title" text DEFAULT 'Care Worker' NOT NULL,
	"employment_type" text DEFAULT 'full_time' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" text,
	"end_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "care_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"next_review_date" text,
	"authorised_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "care_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"author_id" uuid,
	"note_type" text DEFAULT 'daily' NOT NULL,
	"content" text NOT NULL,
	"shift_period" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organisation_id" uuid NOT NULL,
	"person_id" uuid,
	"uploaded_by_id" uuid,
	"name" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer,
	"storage_url" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "persons" ADD CONSTRAINT "persons_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_plans" ADD CONSTRAINT "care_plans_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_notes" ADD CONSTRAINT "care_notes_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_notes" ADD CONSTRAINT "care_notes_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_notes" ADD CONSTRAINT "care_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_person_id_persons_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "persons_organisation_id_idx" ON "persons" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "persons_organisation_status_idx" ON "persons" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "persons_organisation_name_idx" ON "persons" USING btree ("organisation_id","full_name");--> statement-breakpoint
CREATE INDEX "staff_profiles_organisation_id_idx" ON "staff_profiles" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "staff_profiles_organisation_status_idx" ON "staff_profiles" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "staff_profiles_organisation_user_id_idx" ON "staff_profiles" USING btree ("organisation_id","user_id");--> statement-breakpoint
CREATE INDEX "care_plans_organisation_id_idx" ON "care_plans" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "care_plans_organisation_person_idx" ON "care_plans" USING btree ("organisation_id","person_id");--> statement-breakpoint
CREATE INDEX "care_plans_organisation_status_idx" ON "care_plans" USING btree ("organisation_id","status");--> statement-breakpoint
CREATE INDEX "care_notes_organisation_id_idx" ON "care_notes" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "care_notes_organisation_person_idx" ON "care_notes" USING btree ("organisation_id","person_id");--> statement-breakpoint
CREATE INDEX "care_notes_organisation_type_idx" ON "care_notes" USING btree ("organisation_id","note_type");--> statement-breakpoint
CREATE INDEX "care_notes_organisation_created_at_idx" ON "care_notes" USING btree ("organisation_id","created_at");--> statement-breakpoint
CREATE INDEX "documents_organisation_id_idx" ON "documents" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "documents_organisation_person_idx" ON "documents" USING btree ("organisation_id","person_id");--> statement-breakpoint
CREATE INDEX "documents_organisation_category_idx" ON "documents" USING btree ("organisation_id","category");