/**
 * Travel Safety feature module.
 * Provides travel time management, route optimisation (placeholder),
 * lone worker safety (welfare checks, SOS, GPS tracking),
 * and client environment records.
 */

export * from './constants';
export * from './schemas';
export { suggestOptimalRoute, estimateTravelMinutes } from './route-optimisation';
export {
  createTravelRecord,
  getTravelRecords,
  createRouteSuggestion,
  updateRouteSuggestionStatus,
  getRouteSuggestion,
  createWelfareCheck,
  checkInWelfare,
  resolveWelfareCheck,
  getOverdueWelfareChecks,
  getActiveWelfareChecks,
  createSosAlert,
  acknowledgeSosAlert,
  resolveSosAlert,
  getActiveSosAlerts,
  recordGpsPosition,
  getCarerGpsTrail,
  upsertClientEnvironment,
  getClientEnvironment,
  getClientEnvironments,
  upsertLoneWorkerConfig,
  getLoneWorkerConfig,
} from './actions';
