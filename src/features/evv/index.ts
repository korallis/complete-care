/**
 * EVV (Electronic Visit Verification) feature module.
 * Provides GPS-verified check-in/check-out, geofencing, and visit alerting
 * for domiciliary care services.
 */

export * from './constants';
export * from './schemas';
export * from './geofencing';
export {
  createVisit,
  getVisits,
  getVisitById,
  checkIn,
  checkOut,
  getClientVisitHistory,
  getCarerVisitHistory,
  getVisitCheckEvents,
  getActiveAlerts,
  resolveAlert,
  escalateAlert,
  detectLateVisits,
  upsertGeofenceConfig,
  upsertAlertConfig,
  getEvvDashboardStats,
} from './actions';
