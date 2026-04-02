import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { organisations } from './organisations';
import { users } from './users';

// ===========================================================================
// m7-visit-tasks — Task templates, checklists, and completion tracking
// ===========================================================================

// ---------------------------------------------------------------------------
// Task templates — reusable checklists per visit type
// ---------------------------------------------------------------------------

/**
 * Task templates — org-level reusable task sets tied to visit types.
 * E.g. "Personal Care" template with tasks like "assist with washing",
 * "oral hygiene", "dressing".
 */
export const taskTemplates = pgTable(
  'task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Template name, e.g. "Personal Care Checklist" */
    name: text('name').notNull(),
    /** Visit type this template applies to: personal_care | medication | meal_prep | wellness_check | other */
    visitType: text('visit_type').notNull(),
    /** Optional description */
    description: text('description'),
    /** Whether this template is currently active */
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('task_templates_organisation_id_idx').on(t.organisationId),
    index('task_templates_visit_type_idx').on(t.organisationId, t.visitType),
  ],
);

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type NewTaskTemplate = typeof taskTemplates.$inferInsert;

// ---------------------------------------------------------------------------
// Template tasks — individual task items within a template
// ---------------------------------------------------------------------------

/**
 * Template tasks — individual checklist items belonging to a template.
 * Defines the default task content and whether it's mandatory.
 */
export const templateTasks = pgTable(
  'template_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    templateId: uuid('template_id')
      .notNull()
      .references(() => taskTemplates.id, { onDelete: 'cascade' }),
    /** Task title, e.g. "Assist with washing" */
    title: text('title').notNull(),
    /** Optional detailed instructions */
    instructions: text('instructions'),
    /** Whether the carer must complete this task (cannot skip without reason) */
    isMandatory: boolean('is_mandatory').notNull().default(false),
    /** Display order within the template */
    sortOrder: integer('sort_order').notNull().default(0),
    /** Estimated duration in minutes */
    estimatedMinutes: integer('estimated_minutes'),
    /** Category tag for grouping: hygiene | mobility | nutrition | medication | social | other */
    category: text('category'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('template_tasks_organisation_id_idx').on(t.organisationId),
    index('template_tasks_template_id_idx').on(t.templateId),
  ],
);

export type TemplateTask = typeof templateTasks.$inferSelect;
export type NewTemplateTask = typeof templateTasks.$inferInsert;

// ---------------------------------------------------------------------------
// Visit task lists — snapshot of tasks assigned to a specific visit
// ---------------------------------------------------------------------------

/**
 * Visit task lists — links a task template to a specific EVV visit,
 * creating a concrete checklist for the carer to complete.
 */
export const visitTaskLists = pgTable(
  'visit_task_lists',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The EVV visit this task list belongs to */
    visitId: uuid('visit_id').notNull(),
    /** The template this was generated from (null if ad-hoc) */
    templateId: uuid('template_id').references(() => taskTemplates.id, {
      onDelete: 'set null',
    }),
    /** Overall completion percentage (0-100) */
    completionPercentage: integer('completion_percentage').notNull().default(0),
    /** Total number of tasks */
    totalTasks: integer('total_tasks').notNull().default(0),
    /** Number of completed tasks */
    completedTasks: integer('completed_tasks').notNull().default(0),
    /** Number of skipped tasks */
    skippedTasks: integer('skipped_tasks').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('visit_task_lists_organisation_id_idx').on(t.organisationId),
    index('visit_task_lists_visit_id_idx').on(t.visitId),
  ],
);

export type VisitTaskList = typeof visitTaskLists.$inferSelect;
export type NewVisitTaskList = typeof visitTaskLists.$inferInsert;

// ---------------------------------------------------------------------------
// Visit tasks — individual task items for a specific visit
// ---------------------------------------------------------------------------

/**
 * Visit tasks — concrete task items the carer checks off during a visit.
 * Tracks completion status, time spent, and skip reasons.
 */
export const visitTasks = pgTable(
  'visit_tasks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    taskListId: uuid('task_list_id')
      .notNull()
      .references(() => visitTaskLists.id, { onDelete: 'cascade' }),
    /** Source template task (null if ad-hoc) */
    templateTaskId: uuid('template_task_id').references(() => templateTasks.id, {
      onDelete: 'set null',
    }),
    /** Task title (snapshotted from template at creation) */
    title: text('title').notNull(),
    /** Task instructions (snapshotted from template) */
    instructions: text('instructions'),
    /** Whether this task is mandatory */
    isMandatory: boolean('is_mandatory').notNull().default(false),
    /** Display order */
    sortOrder: integer('sort_order').notNull().default(0),
    /** Category tag */
    category: text('category'),
    /** Status: pending | completed | skipped */
    status: text('status').notNull().default('pending'),
    /** Reason for skipping (required if skipped) */
    skipReason: text('skip_reason'),
    /** Time spent on this task in minutes */
    timeSpentMinutes: integer('time_spent_minutes'),
    /** When the task was completed or skipped */
    completedAt: timestamp('completed_at'),
    /** The carer who completed this task */
    completedBy: uuid('completed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** Carer notes for this specific task */
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('visit_tasks_organisation_id_idx').on(t.organisationId),
    index('visit_tasks_task_list_id_idx').on(t.taskListId),
    index('visit_tasks_status_idx').on(t.taskListId, t.status),
  ],
);

export type VisitTaskRecord = typeof visitTasks.$inferSelect;
export type NewVisitTaskRecord = typeof visitTasks.$inferInsert;

// ===========================================================================
// m7-travel-safety — Travel time, route optimisation, lone worker safety,
//                    client environment records
// ===========================================================================

// ---------------------------------------------------------------------------
// Travel records — actual vs expected travel time between visits
// ---------------------------------------------------------------------------

/**
 * Travel records — captures travel time between consecutive visits.
 * Used for compliance monitoring and mileage tracking.
 */
export const travelRecords = pgTable(
  'travel_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** The visit the carer is travelling FROM (null if first visit of day) */
    fromVisitId: uuid('from_visit_id'),
    /** The visit the carer is travelling TO */
    toVisitId: uuid('to_visit_id').notNull(),
    /** Expected travel time in minutes (from route calculation) */
    expectedMinutes: integer('expected_minutes'),
    /** Actual travel time in minutes (check-out to check-in) */
    actualMinutes: integer('actual_minutes'),
    /** Estimated distance in miles */
    expectedDistanceMiles: doublePrecision('expected_distance_miles'),
    /** Actual distance in miles (from GPS tracking if available) */
    actualDistanceMiles: doublePrecision('actual_distance_miles'),
    /** Travel mode: car | public_transport | walking | cycling */
    travelMode: text('travel_mode').notNull().default('car'),
    /** Whether the travel time exceeded the expected threshold */
    isOverdue: boolean('is_overdue').notNull().default(false),
    /** Carer notes about the journey (traffic, detours, etc.) */
    notes: text('notes'),
    /** Departure time */
    departedAt: timestamp('departed_at'),
    /** Arrival time */
    arrivedAt: timestamp('arrived_at'),
    /** Date of travel */
    travelDate: timestamp('travel_date').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('travel_records_organisation_id_idx').on(t.organisationId),
    index('travel_records_carer_id_idx').on(t.carerId),
    index('travel_records_travel_date_idx').on(t.organisationId, t.travelDate),
  ],
);

export type TravelRecord = typeof travelRecords.$inferSelect;
export type NewTravelRecord = typeof travelRecords.$inferInsert;

// ---------------------------------------------------------------------------
// Route optimisation suggestions — placeholder for future integration
// ---------------------------------------------------------------------------

/**
 * Route suggestions — pre-calculated efficient visit orderings.
 * Placeholder for future integration with a routing API (Google/Mapbox).
 */
export const routeSuggestions = pgTable(
  'route_suggestions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Date the route is suggested for */
    routeDate: timestamp('route_date').notNull(),
    /** Ordered list of visit IDs in the suggested sequence */
    suggestedOrder: jsonb('suggested_order').notNull(),
    /** Total estimated travel time in minutes */
    totalEstimatedMinutes: integer('total_estimated_minutes'),
    /** Total estimated distance in miles */
    totalEstimatedMiles: doublePrecision('total_estimated_miles'),
    /** Whether the carer accepted / rejected / ignored this suggestion */
    status: text('status').notNull().default('pending'),
    /** Algorithm or source: manual | simple_nearest | api_optimised */
    optimisationMethod: text('optimisation_method').notNull().default('simple_nearest'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('route_suggestions_organisation_id_idx').on(t.organisationId),
    index('route_suggestions_carer_date_idx').on(t.carerId, t.routeDate),
  ],
);

export type RouteSuggestion = typeof routeSuggestions.$inferSelect;
export type NewRouteSuggestion = typeof routeSuggestions.$inferInsert;

// ---------------------------------------------------------------------------
// Lone worker safety — welfare checks and SOS alerts
// ---------------------------------------------------------------------------

/**
 * Welfare checks — scheduled safety check-ins for lone workers.
 * If a carer doesn't check in after the expected visit duration,
 * an auto-alert is generated.
 */
export const welfareChecks = pgTable(
  'welfare_checks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** The visit this welfare check relates to */
    visitId: uuid('visit_id').notNull(),
    /** Expected check-in time (visit end + buffer) */
    expectedBy: timestamp('expected_by').notNull(),
    /** Actual check-in time */
    checkedInAt: timestamp('checked_in_at'),
    /** Status: pending | checked_in | overdue | escalated | resolved */
    status: text('status').notNull().default('pending'),
    /** Minutes overdue before alert was triggered */
    minutesOverdue: integer('minutes_overdue'),
    /** Who responded to / resolved the alert */
    respondedBy: uuid('responded_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    respondedAt: timestamp('responded_at'),
    /** Resolution outcome: safe | assistance_sent | false_alarm | other */
    resolution: text('resolution'),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('welfare_checks_organisation_id_idx').on(t.organisationId),
    index('welfare_checks_carer_id_idx').on(t.carerId),
    index('welfare_checks_status_idx').on(t.organisationId, t.status),
    index('welfare_checks_expected_by_idx').on(t.expectedBy),
  ],
);

export type WelfareCheck = typeof welfareChecks.$inferSelect;
export type NewWelfareCheck = typeof welfareChecks.$inferInsert;

/**
 * SOS alerts — emergency alerts triggered by carers via SOS button.
 * Captures GPS location at time of alert.
 */
export const sosAlerts = pgTable(
  'sos_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Related visit (if during a visit) */
    visitId: uuid('visit_id'),
    /** GPS latitude at time of SOS */
    latitude: doublePrecision('latitude'),
    /** GPS longitude at time of SOS */
    longitude: doublePrecision('longitude'),
    /** GPS accuracy in metres */
    accuracyMetres: doublePrecision('accuracy_metres'),
    /** Alert status: active | acknowledged | resolved | false_alarm */
    status: text('status').notNull().default('active'),
    /** Free-text message from carer (if they had time to type) */
    message: text('message'),
    /** Who acknowledged the alert */
    acknowledgedBy: uuid('acknowledged_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    acknowledgedAt: timestamp('acknowledged_at'),
    /** Resolution notes */
    resolvedBy: uuid('resolved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at'),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('sos_alerts_organisation_id_idx').on(t.organisationId),
    index('sos_alerts_carer_id_idx').on(t.carerId),
    index('sos_alerts_status_idx').on(t.organisationId, t.status),
    index('sos_alerts_created_at_idx').on(t.createdAt),
  ],
);

export type SosAlert = typeof sosAlerts.$inferSelect;
export type NewSosAlert = typeof sosAlerts.$inferInsert;

/**
 * GPS tracking records — periodic location pings during visits.
 * Used for lone worker safety and route verification.
 */
export const gpsTrackingRecords = pgTable(
  'gps_tracking_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    carerId: uuid('carer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    /** Related visit (if during a visit) */
    visitId: uuid('visit_id'),
    latitude: doublePrecision('latitude').notNull(),
    longitude: doublePrecision('longitude').notNull(),
    accuracyMetres: doublePrecision('accuracy_metres'),
    /** Speed in km/h (if available from device) */
    speedKmh: doublePrecision('speed_kmh'),
    /** Battery level percentage (0-100) */
    batteryLevel: integer('battery_level'),
    /** Whether the carer is in transit or at a location */
    activityType: text('activity_type').default('stationary'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
  },
  (t) => [
    index('gps_tracking_records_organisation_id_idx').on(t.organisationId),
    index('gps_tracking_records_carer_id_idx').on(t.carerId),
    index('gps_tracking_records_visit_id_idx').on(t.visitId),
    index('gps_tracking_records_timestamp_idx').on(t.carerId, t.timestamp),
  ],
);

export type GpsTrackingRecord = typeof gpsTrackingRecords.$inferSelect;
export type NewGpsTrackingRecord = typeof gpsTrackingRecords.$inferInsert;

// ---------------------------------------------------------------------------
// Client environment records — access info, risk notes, parking
// ---------------------------------------------------------------------------

/**
 * Client environment records — key safe codes (encrypted), access instructions,
 * risk notes, and parking information for client locations.
 * One record per client per organisation.
 */
export const clientEnvironments = pgTable(
  'client_environments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** The client this record belongs to */
    clientId: uuid('client_id').notNull(),
    /** Client display name (for quick reference) */
    clientName: text('client_name').notNull(),
    /** Key safe code — stored encrypted at rest via application-layer encryption */
    keySafeCodeEncrypted: text('key_safe_code_encrypted'),
    /** Key safe location description */
    keySafeLocation: text('key_safe_location'),
    /** Access instructions (door entry codes, which buzzer, etc.) */
    accessInstructions: text('access_instructions'),
    /** Risk notes — hazards, aggressive pets, infection control, etc. */
    riskNotes: text('risk_notes'),
    /** Risk level: low | medium | high */
    riskLevel: text('risk_level').notNull().default('low'),
    /** Parking information — where to park, permit required, etc. */
    parkingInfo: text('parking_info'),
    /** Additional environmental notes (stairs, equipment location, etc.) */
    environmentNotes: text('environment_notes'),
    /** Emergency contact for the property */
    emergencyContactName: text('emergency_contact_name'),
    emergencyContactPhone: text('emergency_contact_phone'),
    /** Whether there are known mobility issues accessing the property */
    mobilityConsiderations: text('mobility_considerations'),
    /** Last verified date — when someone last confirmed these details */
    lastVerifiedAt: timestamp('last_verified_at'),
    lastVerifiedBy: uuid('last_verified_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('client_environments_organisation_id_idx').on(t.organisationId),
    index('client_environments_client_id_idx').on(t.clientId),
    unique('client_environments_org_client_unique').on(
      t.organisationId,
      t.clientId,
    ),
  ],
);

export type ClientEnvironment = typeof clientEnvironments.$inferSelect;
export type NewClientEnvironment = typeof clientEnvironments.$inferInsert;

// ---------------------------------------------------------------------------
// Lone worker safety configuration — per-organisation settings
// ---------------------------------------------------------------------------

/**
 * Lone worker safety configuration — welfare check intervals,
 * escalation rules, and SOS alert settings per organisation.
 */
export const loneWorkerConfigs = pgTable(
  'lone_worker_configs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organisationId: uuid('organisation_id')
      .notNull()
      .references(() => organisations.id, { onDelete: 'cascade' }),
    /** Buffer minutes after expected visit end before welfare check triggers */
    welfareCheckBufferMinutes: integer('welfare_check_buffer_minutes')
      .notNull()
      .default(15),
    /** Minutes after missed welfare check before auto-escalation */
    escalationDelayMinutes: integer('escalation_delay_minutes')
      .notNull()
      .default(15),
    /** Whether GPS tracking is enabled during visits */
    gpsTrackingEnabled: boolean('gps_tracking_enabled').notNull().default(true),
    /** GPS ping interval in seconds (e.g. every 60s) */
    gpsPingIntervalSeconds: integer('gps_ping_interval_seconds')
      .notNull()
      .default(60),
    /** Whether SOS button is enabled */
    sosEnabled: boolean('sos_enabled').notNull().default(true),
    /** Coordinator user ID for SOS / welfare escalations */
    escalationContactId: uuid('escalation_contact_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    /** Secondary escalation contact */
    secondaryEscalationContactId: uuid('secondary_escalation_contact_id').references(
      () => users.id,
      { onDelete: 'set null' },
    ),
    /** Whether to auto-call emergency services after extended no-response */
    autoEmergencyCallEnabled: boolean('auto_emergency_call_enabled')
      .notNull()
      .default(false),
    /** Minutes of no response before auto emergency call */
    autoEmergencyCallDelayMinutes: integer('auto_emergency_call_delay_minutes')
      .notNull()
      .default(60),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('lone_worker_configs_organisation_id_idx').on(t.organisationId),
  ],
);

export type LoneWorkerConfig = typeof loneWorkerConfigs.$inferSelect;
export type NewLoneWorkerConfig = typeof loneWorkerConfigs.$inferInsert;
