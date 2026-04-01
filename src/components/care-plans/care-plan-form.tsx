'use client';

/**
 * CarePlanForm — create and edit care plans.
 *
 * Step 1: Template picker (for new plans)
 * Step 2: Fill in sections with rich text editors
 *
 * Uses react-hook-form + zod for validation.
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  CARE_PLAN_TEMPLATES,
  TEMPLATE_LIST,
  createSectionsFromTemplate,
  createSection,
  SECTION_DEFAULTS,
} from '@/features/care-plans/templates';
import type { CreateCarePlanInput, UpdateCarePlanInput } from '@/features/care-plans/schema';
import type { CarePlanSection, CarePlanSectionType } from '@/lib/db/schema/care-plans';
import type { CarePlan } from '@/lib/db/schema/care-plans';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CreateMode = {
  mode: 'create';
  personId: string;
  onSubmit: (data: CreateCarePlanInput) => Promise<{ success: boolean; error?: string; data?: CarePlan }>;
};

type EditMode = {
  mode: 'edit';
  carePlan: CarePlan;
  onSubmit: (data: UpdateCarePlanInput) => Promise<{ success: boolean; error?: string; data?: CarePlan }>;
};

type CarePlanFormProps = (CreateMode | EditMode) & {
  orgSlug: string;
  personId: string;
};

// ---------------------------------------------------------------------------
// Template picker step
// ---------------------------------------------------------------------------

type TemplateSelectorProps = {
  onSelect: (templateId: string) => void;
};

function TemplateSelector({ onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[oklch(0.22_0.04_160)] mb-1">
          Choose a template
        </h2>
        <p className="text-sm text-[oklch(0.55_0_0)]">
          Select a care plan template or start with a blank plan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Care plan templates">
        {TEMPLATE_LIST.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            role="listitem"
            className="group text-left rounded-xl border-2 border-[oklch(0.91_0.005_160)] bg-white p-5 hover:border-[oklch(0.5_0.1_160)] hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" aria-hidden="true">{template.icon}</span>
              <h3 className="font-semibold text-[oklch(0.22_0.04_160)] group-hover:text-[oklch(0.3_0.08_160)] transition-colors">
                {template.name}
              </h3>
            </div>
            <p className="text-xs text-[oklch(0.55_0_0)] mb-3">{template.description}</p>
            {template.sectionTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {template.sectionTypes.map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-[oklch(0.88_0.005_160)] bg-[oklch(0.97_0.003_160)] px-2 py-0.5 text-[10px] text-[oklch(0.45_0.05_160)]"
                  >
                    {SECTION_DEFAULTS[type as CarePlanSectionType]?.title?.split(' ')[0]}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section editor
// ---------------------------------------------------------------------------

type SectionEditorProps = {
  section: CarePlanSection;
  onChange: (section: CarePlanSection) => void;
  onRemove: () => void;
  index: number;
};

function SectionEditor({ section, onChange, onRemove, index }: SectionEditorProps) {
  const sectionDefault = SECTION_DEFAULTS[section.type as CarePlanSectionType];

  return (
    <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[oklch(0.95_0.003_160)] bg-[oklch(0.985_0.003_160)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[oklch(0.3_0.08_160)] text-white text-xs font-bold">
            {index + 1}
          </span>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            className="text-sm font-semibold text-[oklch(0.22_0.04_160)] bg-transparent border-none outline-none min-w-0 flex-1 focus:ring-0 p-0"
            aria-label={`Section ${index + 1} title`}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 rounded-md p-1 text-[oklch(0.65_0_0)] hover:text-red-600 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          aria-label={`Remove ${section.title} section`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Guidance */}
      {sectionDefault?.guidance && !section.content && (
        <div className="px-5 pt-3 pb-0">
          <p className="text-xs text-[oklch(0.6_0.03_160)] italic" aria-label="Section guidance">
            {sectionDefault.guidance}
          </p>
        </div>
      )}

      {/* Content editor */}
      <div className="p-5">
        <textarea
          value={section.content}
          onChange={(e) => onChange({ ...section, content: e.target.value })}
          placeholder={sectionDefault?.guidance ?? 'Enter section content...'}
          rows={6}
          className="w-full resize-y rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
          aria-label={`${section.title} content`}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add section dropdown
// ---------------------------------------------------------------------------

const ALL_SECTION_TYPES: CarePlanSectionType[] = [
  'personal_details',
  'health',
  'mobility',
  'nutrition',
  'continence',
  'personal_care',
  'communication',
  'social',
  'end_of_life',
  'custom',
];

type AddSectionMenuProps = {
  existingTypes: Set<string>;
  onAdd: (type: CarePlanSectionType) => void;
};

function AddSectionMenu({ existingTypes, onAdd }: AddSectionMenuProps) {
  const [open, setOpen] = useState(false);
  const available = ALL_SECTION_TYPES.filter((t) => !existingTypes.has(t) || t === 'custom');

  if (available.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[oklch(0.7_0.05_160)] px-4 py-2.5 text-sm text-[oklch(0.35_0.06_160)] hover:border-[oklch(0.5_0.1_160)] hover:bg-[oklch(0.97_0.005_160)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Add section
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Dropdown */}
          <div
            className="absolute left-0 top-full z-20 mt-1 w-56 rounded-xl border border-[oklch(0.91_0.005_160)] bg-white shadow-lg overflow-hidden"
            role="listbox"
            aria-label="Available sections"
          >
            {available.map((type) => (
              <button
                key={type}
                type="button"
                role="option"
                onClick={() => { onAdd(type); setOpen(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-[oklch(0.22_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] focus-visible:outline-none focus-visible:bg-[oklch(0.97_0.003_160)] transition-colors"
                aria-selected={false}
              >
                {SECTION_DEFAULTS[type]?.title ?? type}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function CarePlanForm(props: CarePlanFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  // Template selection state (only for create mode)
  const [templateSelected, setTemplateSelected] = useState(
    props.mode === 'edit',
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Sections state
  const [sections, setSections] = useState<CarePlanSection[]>(() => {
    if (props.mode === 'edit') {
      return (props.carePlan.sections ?? []) as CarePlanSection[];
    }
    return [];
  });

  // Form setup — use a simple base schema for the shared fields
  const form = useForm<{
    title: string;
    reviewFrequency: 'weekly' | 'monthly' | 'quarterly';
    nextReviewDate?: string;
  }>({
    defaultValues:
      props.mode === 'edit'
        ? {
            title: props.carePlan.title,
            reviewFrequency: (props.carePlan.reviewFrequency as 'weekly' | 'monthly' | 'quarterly') ?? 'monthly',
            nextReviewDate: props.carePlan.nextReviewDate ?? undefined,
          }
        : {
            title: '',
            reviewFrequency: 'monthly',
            nextReviewDate: undefined,
          },
  });

  // Handle template selection
  function handleTemplateSelect(templateId: string) {
    setSelectedTemplate(templateId);
    const sections = createSectionsFromTemplate(
      templateId as keyof typeof CARE_PLAN_TEMPLATES,
    );
    setSections(sections);
    // Pre-fill title if blank
    if (!form.getValues('title')) {
      form.setValue(
        'title',
        CARE_PLAN_TEMPLATES[templateId as keyof typeof CARE_PLAN_TEMPLATES]?.name ?? '',
      );
    }
    setTemplateSelected(true);
  }

  // Section management
  function handleSectionChange(index: number, updated: CarePlanSection) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  function handleAddSection(type: CarePlanSectionType) {
    const newSection = createSection(type, sections.length);
    setSections((prev) => [...prev, newSection]);
  }

  function handleRemoveSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  // Submit
  function handleSubmit(formData: { title: string; reviewFrequency: 'weekly' | 'monthly' | 'quarterly'; nextReviewDate?: string }) {
    setServerError(null);

    startTransition(async () => {
      let result: { success: boolean; error?: string; data?: CarePlan };

      if (props.mode === 'create') {
        result = await props.onSubmit({
          personId: props.personId,
          title: formData.title,
          template: (selectedTemplate as 'comprehensive' | 'personal_care' | 'health_mobility' | 'social_wellbeing' | 'blank' | null) ?? null,
          sections,
          reviewFrequency: formData.reviewFrequency ?? 'monthly',
          nextReviewDate: formData.nextReviewDate || null,
        });
      } else {
        result = await props.onSubmit({
          title: formData.title,
          sections,
          reviewFrequency: formData.reviewFrequency ?? undefined,
          nextReviewDate: formData.nextReviewDate || null,
        });
      }

      if (result.success) {
        toast.success(
          props.mode === 'create'
            ? 'Care plan created'
            : 'Care plan saved — new version created',
        );
        if (result.data) {
          router.push(`/${props.orgSlug}/persons/${props.personId}/care-plans/${result.data.id}`);
        } else {
          router.push(`/${props.orgSlug}/persons/${props.personId}/care-plans`);
        }
      } else {
        setServerError(result.error ?? 'An error occurred');
        toast.error(result.error ?? 'Failed to save care plan');
      }
    });
  }

  // Show template picker for new plans
  if (!templateSelected && props.mode === 'create') {
    return <TemplateSelector onSelect={handleTemplateSelect} />;
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-6"
      aria-label="Care plan form"
    >
      {/* Server error */}
      {serverError && (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {serverError}
        </div>
      )}

      {/* Plan title */}
      <div className="rounded-xl border border-[oklch(0.91_0.005_160)] bg-white p-5">
        <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide mb-4">
          Plan details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Title */}
          <div className="md:col-span-2">
            <label
              htmlFor="cp-title"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Care plan title <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              id="cp-title"
              type="text"
              {...form.register('title')}
              placeholder="e.g., Comprehensive Care Plan — Alice Smith"
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] placeholder:text-[oklch(0.7_0_0)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
              aria-required="true"
              aria-describedby={form.formState.errors.title ? 'cp-title-error' : undefined}
            />
            {form.formState.errors.title && (
              <p id="cp-title-error" className="mt-1.5 text-xs text-red-600" role="alert">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Review frequency */}
          <div>
            <label
              htmlFor="cp-review-freq"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Review frequency
            </label>
            <select
              id="cp-review-freq"
              {...form.register('reviewFrequency')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          {/* Next review date */}
          <div>
            <label
              htmlFor="cp-review-date"
              className="block text-xs font-medium text-[oklch(0.45_0.03_160)] mb-1.5"
            >
              Next review date
            </label>
            <input
              id="cp-review-date"
              type="date"
              {...form.register('nextReviewDate')}
              className="w-full rounded-lg border border-[oklch(0.88_0.005_160)] bg-[oklch(0.99_0.001_160)] px-3.5 py-2.5 text-sm text-[oklch(0.22_0.04_160)] focus:border-[oklch(0.5_0.1_160)] focus:outline-none focus:ring-2 focus:ring-[oklch(0.5_0.1_160)/0.15] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[oklch(0.35_0.04_160)] uppercase tracking-wide">
            Care plan sections
            <span className="ml-2 text-xs font-normal normal-case text-[oklch(0.65_0_0)]">
              ({sections.length} section{sections.length !== 1 ? 's' : ''})
            </span>
          </h2>
        </div>

        {sections.length === 0 && (
          <div className="rounded-xl border border-dashed border-[oklch(0.88_0.005_160)] bg-[oklch(0.985_0.003_160)] p-8 text-center">
            <p className="text-sm text-[oklch(0.55_0_0)] mb-3">No sections yet. Add sections to document care needs.</p>
          </div>
        )}

        <div className="space-y-4">
          {sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              onChange={(updated) => handleSectionChange(index, updated)}
              onRemove={() => handleRemoveSection(index)}
              index={index}
            />
          ))}
        </div>

        <AddSectionMenu
          existingTypes={new Set(sections.map((s) => s.type).filter((t) => t !== 'custom'))}
          onAdd={handleAddSection}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[oklch(0.88_0.005_160)] bg-white px-4 py-2 text-sm font-medium text-[oklch(0.35_0.04_160)] hover:bg-[oklch(0.97_0.003_160)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[oklch(0.3_0.08_160)] px-5 py-2 text-sm font-medium text-white hover:bg-[oklch(0.25_0.08_160)] disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.5_0.1_160)] focus-visible:ring-offset-2"
          aria-busy={isPending}
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            props.mode === 'create' ? 'Create care plan' : 'Save changes'
          )}
        </button>
      </div>
    </form>
  );
}
