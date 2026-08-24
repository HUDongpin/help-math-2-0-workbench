export interface FamilyFeatureEnvironment {
  FAMILY_EMAIL_NOTIFICATIONS_ENABLED?: string;
  FAMILY_MESSAGING_ENABLED?: string;
  FAMILY_PORTAL_ENABLED?: string;
  FAMILY_SYNTHETIC_DEMO_ENABLED?: string;
  NODE_ENV?: string;
}

function exactlyTrue(value: string | undefined) {
  return value === 'true';
}

export interface FamilyFeatureFlags {
  emailNotificationsEnabled: boolean;
  messagingEnabled: boolean;
  portalEnabled: boolean;
  syntheticDemoEnabled: boolean;
}

export function readFamilyFeatureFlags(
  environment: FamilyFeatureEnvironment = process.env,
): FamilyFeatureFlags {
  const portalEnabled = exactlyTrue(environment.FAMILY_PORTAL_ENABLED);
  const syntheticDemoEnabled = portalEnabled
    && environment.NODE_ENV !== 'production'
    && exactlyTrue(environment.FAMILY_SYNTHETIC_DEMO_ENABLED);
  const messagingEnabled = portalEnabled
    && exactlyTrue(environment.FAMILY_MESSAGING_ENABLED);
  const emailNotificationsEnabled = messagingEnabled
    && exactlyTrue(environment.FAMILY_EMAIL_NOTIFICATIONS_ENABLED);

  return {
    emailNotificationsEnabled,
    messagingEnabled,
    portalEnabled,
    syntheticDemoEnabled,
  };
}

export function isFamilyPortalPath(pathname: string) {
  return pathname === '/family'
    || pathname.startsWith('/family/')
    || pathname === '/teacher/messages'
    || pathname.startsWith('/teacher/messages/')
    || pathname === '/teacher/family-access'
    || pathname.startsWith('/teacher/family-access/')
    || pathname === '/admin/family-access'
    || pathname.startsWith('/admin/family-access/')
    || pathname === '/admin/family-operations'
    || pathname.startsWith('/admin/family-operations/');
}

export function isFamilyExternalApiPath(pathname: string) {
  return isFamilyWebhookApiPath(pathname) || isFamilyCronApiPath(pathname);
}

export function isFamilyWebhookApiPath(pathname: string) {
  return pathname === '/api/webhooks/resend';
}

export function isFamilyCronApiPath(pathname: string) {
  return pathname === '/api/cron/family-notifications';
}

export function isFamilyInvitationEntryPath(pathname: string) {
  return pathname === '/family/invitations/accept';
}
