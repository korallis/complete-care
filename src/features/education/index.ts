/**
 * Education tracking feature — PEP management, attendance, exclusions,
 * Pupil Premium Plus, and SDQ scoring for children's homes.
 */

// Zod validation schemas
export {
  schoolRecordSchema,
  pepSchema,
  pepAttendeeSchema,
  educationAttendanceSchema,
  exclusionRecordSchema,
  pupilPremiumPlusSchema,
  sdqAssessmentSchema,
} from './schema';

export type {
  SchoolRecordFormData,
  PepFormData,
  PepAttendeeFormData,
  EducationAttendanceFormData,
  ExclusionRecordFormData,
  PupilPremiumPlusFormData,
  SdqAssessmentFormData,
  SdqAssessmentParsed,
} from './schema';

// Components
export { EducationOverview } from './components/education-overview';
export { SdqTrendChart } from './components/sdq-trend-chart';
export { PepForm } from './components/pep-form';
export { AttendanceForm } from './components/attendance-form';
export { ExclusionForm } from './components/exclusion-form';
export { SdqForm } from './components/sdq-form';
export { SchoolRecordForm } from './components/school-record-form';
export { PpPlusForm } from './components/pp-plus-form';
