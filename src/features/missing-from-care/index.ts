/**
 * Missing from Care feature module.
 *
 * Implements the Philomena Protocol, missing episode recording with
 * timestamped escalation, and Return Home Interview (RHI) workflow
 * for children's residential homes.
 */

// Zod schemas and utility functions
export {
  // Enums
  riskLevelEnum,
  episodeStatusEnum,
  rhiStatusEnum,
  buildEnum,
  returnMethodEnum,
  exploitationConcernEnum,
  timelineActionTypeEnum,
  // Schemas
  createPhilomenaProfileSchema,
  updatePhilomenaProfileSchema,
  createMissingEpisodeSchema,
  recordPoliceNotificationSchema,
  recordAuthorityNotificationSchema,
  recordReturnSchema,
  addTimelineEntrySchema,
  completeRhiSchema,
  escalateRhiSchema,
  // Utilities
  isPhotoStale,
  isEscalationDue,
  calculateRhiDeadline,
  isRhiOverdue,
  PHOTO_STALENESS_DAYS,
  DEFAULT_ESCALATION_THRESHOLDS,
} from './schema';
export type { RiskLevel, EpisodeStatus, RhiStatus } from './schema';

// Server actions
export {
  createPhilomenaProfile,
  updatePhilomenaProfile,
  getPhilomenaProfile,
  createMissingEpisode,
  recordPoliceNotification,
  recordAuthorityNotification,
  recordReturn,
  addTimelineEntry,
  completeRhi,
  escalateRhi,
  getMissingEpisodesForPerson,
  getOpenMissingEpisodes,
  getEpisodeTimeline,
  getPendingRhis,
  getOverdueRhis,
  getRhiForEpisode,
  getMissingEpisodeById,
  getRhiById,
} from './actions';

// Components
export { PhilomenaProfileCard } from './components/philomena-profile-card';
export { MissingEpisodeTimeline } from './components/missing-episode-timeline';
export { MissingEpisodeCard } from './components/missing-episode-card';
export { RhiCard } from './components/rhi-card';
