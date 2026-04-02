import type { Reg45Report, NewReg45Report, Reg45ReportVersion, NewReg45ReportVersion } from '@/lib/db/schema';

export type { Reg45Report, NewReg45Report, Reg45ReportVersion, NewReg45ReportVersion };

export type Reg45Status = 'draft' | 'pending_review' | 'signed_off' | 'archived';

export interface Reg45ReportContent {
  reg44FindingsSummary: string;
  actionsTaken: string;
  qualityOfCareAssessment: string;
  staffDevelopment: string;
  childrensProgress: string;
  recommendations: string;
}
