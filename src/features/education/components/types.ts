/**
 * Shared types used across education components.
 */

export type SenStatusValues = 'none' | 'sen_support' | 'ehcp' | 'assessment_pending';

export type AttendanceMarkValues =
  | 'present'
  | 'late'
  | 'authorised_absent'
  | 'unauthorised_absent'
  | 'excluded'
  | 'not_required';

export type PepTermValues = 'autumn' | 'spring' | 'summer';

export type PepStatusValues = 'draft' | 'scheduled' | 'completed' | 'reviewed';

export type ExclusionTypeValues = 'fixed_term' | 'permanent';

export type SdqRespondentValues = 'self' | 'parent_carer' | 'teacher';
