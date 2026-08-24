export const APP_ROLES = [
  'guardian',
  'learner',
  'teacher',
  'school_admin',
  'district_admin',
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const GUARDIAN_LINK_STATUSES = [
  'pending',
  'active',
  'revoked',
  'expired',
] as const;

export type GuardianLinkStatus = (typeof GUARDIAN_LINK_STATUSES)[number];

export const INVITATION_STATUSES = [
  'pending',
  'accepted',
  'revoked',
  'expired',
] as const;

export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const FAMILY_ASSIGNMENT_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'overdue',
] as const;

export type FamilyAssignmentStatus =
  (typeof FAMILY_ASSIGNMENT_STATUSES)[number];

export const FAMILY_SKILL_BANDS = [
  'insufficient_evidence',
  'starting',
  'growing',
  'strong',
] as const;

export type FamilySkillBand = (typeof FAMILY_SKILL_BANDS)[number];

export const FAMILY_MESSAGE_TOPICS = [
  'assignment',
  'progress',
  'access',
  'technical',
  'other',
] as const;

export type FamilyMessageTopic = (typeof FAMILY_MESSAGE_TOPICS)[number];

export const FAMILY_THREAD_STATUSES = ['open', 'closed'] as const;

export type FamilyThreadStatus = (typeof FAMILY_THREAD_STATUSES)[number];

export const NOTIFICATION_KINDS = [
  'guardian_invitation',
  'family_message',
  'weekly_family_digest',
  'account_security',
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const FAMILY_PERMISSIONS = [
  'family:read',
  'family:message',
  'family:relinquish',
  'family:manage-access',
  'family:teacher-message',
  'family:announce',
] as const;

export type FamilyPermission = (typeof FAMILY_PERMISSIONS)[number];

/**
 * Server-only authorization result. Provider identity is intentionally kept
 * separate from every browser DTO below.
 */
export interface AuthorizationContext {
  appUserId: string;
  currentTenantId: string;
  dataMode: 'production' | 'synthetic';
  messagingEnabled: boolean;
  provider: 'clerk' | 'supabase' | 'synthetic';
  providerIssuer: string;
  providerSubject: string;
  sessionId: string;
  roles: readonly AppRole[];
  permissions: readonly FamilyPermission[];
  synthetic: boolean;
}

export interface FamilyTenantSummary {
  id: string;
  displayName: string;
}

export interface FamilyChildSummary {
  id: string;
  displayName: string;
  gradeLabel: string;
  schoolName: string;
  linkStatus: Extract<GuardianLinkStatus, 'active'>;
  dataUpdatedAt: string | null;
}

export interface FamilyAssignmentSummary {
  id: string;
  assignedAt: string;
  dueAt: string | null;
  familyNote: string | null;
  lessonReleaseId: string;
  lessonTitle: string;
  reviewedPages: number;
  status: FamilyAssignmentStatus;
  teacherDisplayName: string;
  title: string;
  totalPages: number;
}

export interface FamilyLessonProgress {
  assignmentId: string | null;
  computedAt: string;
  lastActivityAt: string | null;
  lessonReleaseId: string;
  lessonTitle: string;
  projectionVersion: 'progress_projection_v1';
  reviewedPages: number;
  stale: boolean;
  totalPages: number;
}

export interface FamilySkillSummary {
  band: FamilySkillBand;
  computedAt: string;
  evidenceCount: number;
  explanation: string;
  projectionVersion: 'skill_projection_v1';
  skillId: string;
  skillName: string;
  stale: boolean;
  windowEndsAt: string;
  windowStartsAt: string;
}

export interface FamilySupportActivity {
  description: string;
  source: 'teacher' | 'approved_curriculum';
  title: string;
}

export interface FamilyMessageSummary {
  body: string;
  id: string;
  mine: boolean;
  redacted: boolean;
  sentAt: string;
  senderLabel: string;
}

export interface FamilyMessageThreadSummary {
  childId: string;
  id: string;
  lastMessageAt: string;
  messages: readonly FamilyMessageSummary[];
  participantLabel: string;
  status: FamilyThreadStatus;
  topic: FamilyMessageTopic;
  unreadCount: number;
}

export interface FamilyMessageContactSummary {
  childId: string;
  enrollmentId: string;
  staffDisplayName: string;
  staffUserId: string;
}

export interface FamilyAnnouncementSummary {
  body: string;
  id: string;
  publishedAt: string;
  publisherLabel: string;
  title: string;
}

export interface FamilyNotificationPreference {
  messageEmailEnabled: boolean;
  weeklyDigestEnabled: boolean;
}

export interface FamilyOverview {
  announcements: readonly FamilyAnnouncementSummary[];
  assignments: readonly FamilyAssignmentSummary[];
  completedLessonPagesThisWeek: number;
  dataUpdatedAt: string | null;
  latestActivityAt: string | null;
  growingSkills: readonly FamilySkillSummary[];
  supportActivity: FamilySupportActivity | null;
  unreadMessageCount: number;
}

export interface FamilyWorkspace {
  assignments: readonly FamilyAssignmentSummary[];
  children: readonly FamilyChildSummary[];
  lessons: readonly FamilyLessonProgress[];
  messageContacts: readonly FamilyMessageContactSummary[];
  notificationPreference: FamilyNotificationPreference;
  overview: FamilyOverview;
  selectedChildId: string;
  skills: readonly FamilySkillSummary[];
  tenant: FamilyTenantSummary;
  threads: readonly FamilyMessageThreadSummary[];
}

export interface TeacherFamilyInboxMessage {
  body: string;
  id: string;
  mine: boolean;
  senderLabel: string;
  sentAt: string;
}

export interface TeacherFamilyInboxThread {
  childId: string;
  childLabel: string;
  gradeLabel: string;
  guardianLabel: string;
  id: string;
  messages: readonly TeacherFamilyInboxMessage[];
  status: FamilyThreadStatus;
  topic: FamilyMessageTopic;
  unreadCount: number;
}

export interface TeacherFamilyInbox {
  tenant: FamilyTenantSummary;
  threads: readonly TeacherFamilyInboxThread[];
}

export interface TeacherAnnouncementSchoolSummary {
  displayName: string;
  id: string;
}

export interface TeacherAnnouncementSchools {
  schools: readonly TeacherAnnouncementSchoolSummary[];
  tenant: FamilyTenantSummary;
}

export interface AdminFamilyAccessChild {
  displayName: string;
  gradeLabel: string;
  id: string;
  schoolName: string;
}

export interface AdminFamilyAccessInvitation {
  childDisplayName: string;
  childId: string;
  destinationLabel: string;
  expiresAt: string | null;
  gradeLabel: string;
  guardianLabel: string;
  guardianLinkId: string | null;
  id: string;
  status: Extract<InvitationStatus, 'pending' | 'accepted' | 'revoked'>;
}

export interface AdminFamilyAccessWorkspace {
  children: readonly AdminFamilyAccessChild[];
  invitations: readonly AdminFamilyAccessInvitation[];
  tenant: FamilyTenantSummary;
}

export const FAMILY_ACTION_ERROR_CODES = [
  'AUTH_REQUIRED',
  'FORBIDDEN',
  'NOT_FOUND',
  'INVALID_INPUT',
  'INVITATION_INVALID',
  'INVITATION_EXPIRED',
  'EMAIL_MISMATCH',
  'THREAD_CLOSED',
  'FEATURE_DISABLED',
  'RETRY_LATER',
] as const;

export type FamilyActionErrorCode =
  (typeof FAMILY_ACTION_ERROR_CODES)[number];

export type FamilyActionResult<T = undefined> =
  | (T extends undefined ? {ok: true} : {ok: true; data: T})
  | {ok: false; error: FamilyActionErrorCode};

export interface FamilyInvitationReceipt {
  invitationId: string;
  expiresAt: string;
}

export interface FamilyMessageReceipt {
  messageId: string;
  threadId: string;
}

export interface FamilyAnnouncementReceipt {
  announcementId: string;
  expiresAt: string;
  publishedAt: string;
}

export const FAMILY_RIGHTS_REQUEST_KINDS = [
  'access',
  'correction',
  'deletion',
  'relationship_dispute',
] as const;
export type FamilyRightsRequestKind =
  (typeof FAMILY_RIGHTS_REQUEST_KINDS)[number];

export const FAMILY_REVIEW_STATUSES = [
  'pending',
  'completed',
  'declined',
] as const;
export type FamilyReviewStatus = (typeof FAMILY_REVIEW_STATUSES)[number];

export const FAMILY_INVITATION_SUGGESTION_STATUSES = [
  'pending',
  'reviewed',
  'dismissed',
] as const;
export type FamilyInvitationSuggestionStatus =
  (typeof FAMILY_INVITATION_SUGGESTION_STATUSES)[number];

export const FAMILY_SUPPORT_ACCESS_STATUSES = [
  'pending',
  'approved',
  'denied',
  'expired',
] as const;
export type FamilySupportAccessStatus =
  (typeof FAMILY_SUPPORT_ACCESS_STATUSES)[number];

export interface FamilyRightsRequestSummary {
  childDisplayName: string;
  childId: string;
  decidedAt: string | null;
  details: string | null;
  id: string;
  kind: FamilyRightsRequestKind;
  status: FamilyReviewStatus;
  submittedAt: string;
}

export interface FamilyAccountActivitySummary {
  action: 'inserted' | 'updated' | 'deleted';
  entityType: string;
  id: string;
  occurredAt: string;
}

export interface FamilyGovernanceWorkspace {
  accountActivity: readonly FamilyAccountActivitySummary[];
  rightsRequests: readonly FamilyRightsRequestSummary[];
  tenant: FamilyTenantSummary;
}

export interface TeacherInvitationSuggestionChild {
  displayName: string;
  gradeLabel: string;
  id: string;
  schoolName: string;
}

export interface TeacherInvitationSuggestionSummary {
  childDisplayName: string;
  childId: string;
  decidedAt: string | null;
  id: string;
  note: string | null;
  status: FamilyInvitationSuggestionStatus;
  submittedAt: string;
}

export interface TeacherInvitationSuggestionWorkspace {
  eligibleChildren: readonly TeacherInvitationSuggestionChild[];
  suggestions: readonly TeacherInvitationSuggestionSummary[];
  tenant: FamilyTenantSummary;
}

export interface AdminFamilyRightsRequestSummary extends FamilyRightsRequestSummary {
  guardianLabel: string;
}

export interface AdminFamilyInvitationSuggestionSummary
  extends TeacherInvitationSuggestionSummary {
  teacherLabel: string;
}

export interface AdminFamilySupportRequestSummary {
  accessExpiresAt: string | null;
  canAccess: boolean;
  decidedAt: string | null;
  decisionNote: string | null;
  id: string;
  reason: string;
  requestedAt: string;
  requestorLabel: string;
  status: FamilySupportAccessStatus;
  threadId: string;
}

export interface AdminFamilyOperationsWorkspace {
  invitationSuggestions: readonly AdminFamilyInvitationSuggestionSummary[];
  rightsRequests: readonly AdminFamilyRightsRequestSummary[];
  supportRequests: readonly AdminFamilySupportRequestSummary[];
  tenant: FamilyTenantSummary;
}

export interface FamilySupportCaseMessage {
  body: string;
  id: string;
  redacted: boolean;
  senderLabel: string;
  sentAt: string;
}

export interface FamilySupportCase {
  request: {
    accessExpiresAt: string;
    id: string;
    reason: string;
  };
  tenantDisplayName: string;
  tenantId: string;
  thread: {
    childLabel: string;
    guardianLabel: string;
    id: string;
    messages: readonly FamilySupportCaseMessage[];
    staffLabel: string;
    status: FamilyThreadStatus;
    topic: FamilyMessageTopic;
  };
}

export interface FamilyGovernanceMutationReceipt {
  requestId: string;
  submittedAt?: string;
  requestedAt?: string;
}

export interface FamilySuggestionMutationReceipt {
  submittedAt: string;
  suggestionId: string;
}

export interface FamilySupportDecisionReceipt {
  accessExpiresAt: string | null;
  requestId: string;
  status: Extract<FamilySupportAccessStatus, 'approved' | 'denied'>;
}
