/**
 * Family Portal feature module.
 *
 * Provides family members with secure, read-only access to care information
 * with domain-specific views, messaging, and photo/update sharing.
 */

// Types
export * from './types';

// Components
export {
  PortalHeader,
  DomainView,
  MessageThread,
  UpdateCard,
  CareInformation,
  InvitationForm,
  PortalContextBar,
} from './components';

// Domain view utilities
export { DOMAIN_CONFIG, buildEmptyPortalView, getDomainSectionTitles } from './lib/domain-views';
