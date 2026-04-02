import type { EolCarePlan, NewEolCarePlan } from '@/lib/db/schema';

export type { EolCarePlan, NewEolCarePlan };

export type EolCarePlanStatus = 'draft' | 'active' | 'reviewed' | 'archived';

export type PreferredPlaceOfDeath = 'home' | 'hospice' | 'hospital' | 'care_home';

export interface KeyContact {
  name: string;
  relationship: string;
  phone: string;
  role: string;
}

export interface AnticipatoryMedication {
  medication: string;
  dose: string;
  route: string;
  indication: string;
  prescribedBy: string;
}
