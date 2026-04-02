/**
 * Visit Tasks feature constants — task statuses, categories, visit types.
 */

export const TASK_STATUSES = ['pending', 'completed', 'skipped'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CATEGORIES = [
  'hygiene',
  'mobility',
  'nutrition',
  'medication',
  'social',
  'other',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const VISIT_TYPES = [
  'personal_care',
  'medication',
  'meal_prep',
  'wellness_check',
  'other',
] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; colour: string }
> = {
  pending: { label: 'Pending', colour: 'bg-slate-100 text-slate-700' },
  completed: { label: 'Completed', colour: 'bg-green-100 text-green-700' },
  skipped: { label: 'Skipped', colour: 'bg-amber-100 text-amber-700' },
};

export const TASK_CATEGORY_CONFIG: Record<
  TaskCategory,
  { label: string; icon: string }
> = {
  hygiene: { label: 'Hygiene', icon: 'droplets' },
  mobility: { label: 'Mobility', icon: 'accessibility' },
  nutrition: { label: 'Nutrition', icon: 'utensils' },
  medication: { label: 'Medication', icon: 'pill' },
  social: { label: 'Social', icon: 'users' },
  other: { label: 'Other', icon: 'circle-dot' },
};

export const VISIT_TYPE_CONFIG: Record<
  VisitType,
  { label: string; colour: string }
> = {
  personal_care: { label: 'Personal Care', colour: 'bg-blue-100 text-blue-700' },
  medication: { label: 'Medication', colour: 'bg-purple-100 text-purple-700' },
  meal_prep: { label: 'Meal Prep', colour: 'bg-orange-100 text-orange-700' },
  wellness_check: { label: 'Wellness Check', colour: 'bg-teal-100 text-teal-700' },
  other: { label: 'Other', colour: 'bg-gray-100 text-gray-500' },
};
