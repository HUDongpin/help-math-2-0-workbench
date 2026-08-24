import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {
  adminFamilyOperationsWorkspaceDtoSchema,
  adminFamilyAccessWorkspaceDtoSchema,
  familyGovernanceWorkspaceDtoSchema,
  familySupportCaseDtoSchema,
  familyWorkspaceDtoSchema,
  teacherInvitationSuggestionWorkspaceDtoSchema,
  teacherAnnouncementSchoolsDtoSchema,
  teacherFamilyInboxDtoSchema,
} from '../lib/family/dto-schemas';
import {matchesFamilyCronBearer} from '../lib/family/cron-auth';
import {
  isFamilyCronApiPath,
  isFamilyInvitationEntryPath,
  isFamilyPortalPath,
  isFamilyWebhookApiPath,
  readFamilyFeatureFlags,
} from '../lib/family/feature-flags';
import {
  acceptGuardianInvitationSchema,
  closeFamilyThreadSchema,
  createGuardianInvitationSchema,
  createFamilyInvitationSuggestionSchema,
  createFamilyRightsRequestSchema,
  createFamilySupportAccessRequestSchema,
  decideFamilySupportAccessRequestSchema,
  learningEventV2BatchSchema,
  publishSchoolAnnouncementSchema,
  redactFamilyMessageSchema,
  revokeGuardianLinkSchema,
  sendFamilyMessageSchema,
  updateFamilyNotificationPreferencesSchema,
} from '../lib/family/schemas';
import {
  APP_ROLES,
  FAMILY_ASSIGNMENT_STATUSES,
  FAMILY_MESSAGE_TOPICS,
  FAMILY_SKILL_BANDS,
  FAMILY_THREAD_STATUSES,
  GUARDIAN_LINK_STATUSES,
  INVITATION_STATUSES,
  NOTIFICATION_KINDS,
} from '../lib/family/types';
import {
  getAuthorizedAdminFamilyAccessData,
  getAuthorizedFamilyPortalData,
  getAuthorizedTeacherMessagesData,
} from '../lib/family/family-ui-data';

const ids = {
  assignment: '10000000-0000-4000-8000-000000000040',
  announcement: '10000000-0000-4000-8000-000000000074',
  child: '10000000-0000-4000-8000-000000000030',
  message: '10000000-0000-4000-8000-000000000070',
  message2: '10000000-0000-4000-8000-000000000073',
  guardianLink: '10000000-0000-4000-8000-000000000071',
  invitation: '10000000-0000-4000-8000-000000000072',
  enrollment: '10000000-0000-4000-8000-000000000050',
  session: '10000000-0000-4000-8000-000000000080',
  tenant: '10000000-0000-4000-8000-000000000001',
  teacher: '10000000-0000-4000-8000-000000000012',
  school: '10000000-0000-4000-8000-000000000101',
  thread: '10000000-0000-4000-8000-000000000060',
} as const;

function validTeacherInbox() {
  return {
    tenant: {displayName: 'North Valley Demo District', id: ids.tenant},
    threads: [{
      childId: ids.child,
      childLabel: 'Maya R.',
      gradeLabel: 'Grade 4',
      guardianLabel: 'Verified guardian',
      id: ids.thread,
      messages: [{
        body: 'Could we review this strategy together?',
        id: ids.message,
        mine: false,
        senderLabel: 'Verified guardian',
        sentAt: '2026-08-22T10:00:00.000Z',
      }],
      status: 'open',
      topic: 'progress',
      unreadCount: 1,
    }],
  } as const;
}

function validTeacherAnnouncementSchools() {
  return {
    schools: [{displayName: 'Willow Creek School', id: ids.school}],
    tenant: {displayName: 'North Valley Demo District', id: ids.tenant},
  } as const;
}

function validAdminWorkspace() {
  return {
    children: [{
      displayName: 'Maya R.',
      gradeLabel: 'Grade 4',
      id: ids.child,
      schoolName: 'Willow Creek School',
    }],
    invitations: [{
      childDisplayName: 'Maya R.',
      childId: ids.child,
      destinationLabel: 'Verified adult ••••',
      expiresAt: null,
      gradeLabel: 'Grade 4',
      guardianLabel: 'Verified guardian',
      guardianLinkId: ids.guardianLink,
      id: ids.invitation,
      status: 'accepted',
    }],
    tenant: {displayName: 'North Valley Demo District', id: ids.tenant},
  } as const;
}

function assignment() {
  return {
    assignedAt: '2026-08-18T09:00:00.000Z',
    dueAt: '2026-08-28T09:00:00.000Z',
    familyNote: 'Ask the learner to explain one example aloud.',
    id: ids.assignment,
    lessonReleaseId: 'course-g04-l03-release-v1',
    lessonTitle: 'Patterns and relationships',
    reviewedPages: 8,
    status: 'in_progress',
    teacherDisplayName: 'Ms. Rivera',
    title: 'Review Lesson 3',
    totalPages: 39,
  } as const;
}

function skill() {
  return {
    band: 'growing',
    computedAt: '2026-08-22T11:00:00.000Z',
    evidenceCount: 7,
    explanation: 'Recent reviewed activities show a consistent pattern.',
    projectionVersion: 'skill_projection_v1',
    skillId: 'skill-patterns-v1',
    skillName: 'Describe a number pattern',
    stale: false,
    windowEndsAt: '2026-08-22T11:00:00.000Z',
    windowStartsAt: '2026-08-08T11:00:00.000Z',
  } as const;
}

function validWorkspace() {
  const currentAssignment = assignment();
  const growingSkill = skill();
  return {
    assignments: [currentAssignment],
    children: [{
      dataUpdatedAt: '2026-08-22T11:00:00.000Z',
      displayName: 'Maya R.',
      gradeLabel: 'Grade 4',
      id: ids.child,
      linkStatus: 'active',
      schoolName: 'Willow Creek School',
    }],
    lessons: [{
      assignmentId: ids.assignment,
      computedAt: '2026-08-22T11:00:00.000Z',
      lastActivityAt: '2026-08-22T10:30:00.000Z',
      lessonReleaseId: 'course-g04-l03-release-v1',
      lessonTitle: 'Patterns and relationships',
      projectionVersion: 'progress_projection_v1',
      reviewedPages: 8,
      stale: false,
      totalPages: 39,
    }],
    messageContacts: [{
      childId: ids.child,
      enrollmentId: ids.enrollment,
      staffDisplayName: 'Ms. Rivera',
      staffUserId: ids.teacher,
    }],
    notificationPreference: {
      messageEmailEnabled: true,
      weeklyDigestEnabled: false,
    },
    overview: {
      announcements: [{
        body: 'Family math night begins at 6 PM.',
        id: ids.announcement,
        publishedAt: '2026-08-21T16:00:00.000Z',
        publisherLabel: 'Willow Creek School',
        title: 'Family math night',
      }],
      assignments: [currentAssignment],
      completedLessonPagesThisWeek: 6,
      dataUpdatedAt: '2026-08-22T11:00:00.000Z',
      growingSkills: [growingSkill],
      latestActivityAt: '2026-08-22T10:30:00.000Z',
      supportActivity: {
        description: 'Find three repeating patterns at home.',
        source: 'approved_curriculum',
        title: 'Pattern walk',
      },
      unreadMessageCount: 1,
    },
    selectedChildId: ids.child,
    skills: [growingSkill],
    tenant: {displayName: 'North Valley Demo District', id: ids.tenant},
    threads: [{
      childId: ids.child,
      id: ids.thread,
      lastMessageAt: '2026-08-22T10:05:00.000Z',
      messages: [{
        body: 'Maya explained the pattern clearly today.',
        id: ids.message,
        mine: false,
        redacted: false,
        senderLabel: 'Ms. Rivera',
        sentAt: '2026-08-22T10:00:00.000Z',
      }, {
        body: '[Message removed]',
        id: ids.message2,
        mine: true,
        redacted: true,
        senderLabel: 'You',
        sentAt: '2026-08-22T10:05:00.000Z',
      }],
      participantLabel: 'Ms. Rivera',
      status: 'open',
      topic: 'progress',
      unreadCount: 1,
    }],
  };
}

test('Family Portal state and role enums stay frozen to the approved contract', () => {
  assert.deepEqual(APP_ROLES, [
    'guardian', 'learner', 'teacher', 'school_admin', 'district_admin',
  ]);
  assert.deepEqual(GUARDIAN_LINK_STATUSES, [
    'pending', 'active', 'revoked', 'expired',
  ]);
  assert.deepEqual(INVITATION_STATUSES, [
    'pending', 'accepted', 'revoked', 'expired',
  ]);
  assert.deepEqual(FAMILY_ASSIGNMENT_STATUSES, [
    'not_started', 'in_progress', 'completed', 'overdue',
  ]);
  assert.deepEqual(FAMILY_SKILL_BANDS, [
    'insufficient_evidence', 'starting', 'growing', 'strong',
  ]);
  assert.deepEqual(FAMILY_MESSAGE_TOPICS, [
    'assignment', 'progress', 'access', 'technical', 'other',
  ]);
  assert.deepEqual(FAMILY_THREAD_STATUSES, ['open', 'closed']);
  assert.deepEqual(NOTIFICATION_KINDS, [
    'guardian_invitation', 'family_message', 'weekly_family_digest',
    'account_security',
  ]);
});

test('invitation input normalizes an adult email and rejects authority fields', () => {
  const accepted = createGuardianInvitationSchema.parse({
    clientMutationId: 'invite-request-001',
    studentId: ids.child,
    verifiedAdultEmail: '  FAMILY@EXAMPLE.ORG ',
  });
  assert.equal(accepted.verifiedAdultEmail, 'family@example.org');

  const rejected = createGuardianInvitationSchema.safeParse({
    ...accepted,
    role: 'guardian',
    tenantId: ids.tenant,
  });
  assert.equal(rejected.success, false);
});

test('invitation, revocation, close, and preference mutations accept no client authority', () => {
  assert.equal(acceptGuardianInvitationSchema.safeParse({
    clientMutationId: 'family-accept-001',
    token: 'a'.repeat(43),
  }).success, true);
  assert.equal(acceptGuardianInvitationSchema.safeParse({
    clientMutationId: 'family-accept-002',
    email: 'family@example.org',
    tenantId: ids.tenant,
    token: 'a'.repeat(43),
  }).success, false);
  assert.equal(revokeGuardianLinkSchema.safeParse({
    clientMutationId: 'family-revoke-001',
    guardianLinkId: ids.thread,
    reason: 'Authorization withdrawn by the school.',
  }).success, true);
  assert.equal(closeFamilyThreadSchema.safeParse({
    clientMutationId: 'family-close-001',
    status: 'open',
    threadId: ids.thread,
  }).success, false);
  assert.equal(updateFamilyNotificationPreferencesSchema.safeParse({
    appUserId: ids.child,
    clientMutationId: 'family-prefs-001',
    messageEmailEnabled: true,
    tenantId: ids.tenant,
    weeklyDigestEnabled: false,
  }).success, false);
});

test('family messages require either an authorized thread or the full new-thread tuple', () => {
  const body = 'e\u0301'.repeat(2_000).normalize('NFC');
  assert.equal(sendFamilyMessageSchema.safeParse({
    body,
    clientMutationId: 'message-request-001',
    threadId: ids.thread,
  }).success, true);
  assert.equal(sendFamilyMessageSchema.safeParse({
    body: `${body}x`,
    clientMutationId: 'message-request-002',
    threadId: ids.thread,
  }).success, false);
  assert.equal(sendFamilyMessageSchema.safeParse({
    body: 'Please call when convenient.',
    clientMutationId: 'message-request-003',
  }).success, false);
  assert.equal(sendFamilyMessageSchema.safeParse({
    body: 'Please call when convenient.',
    childId: ids.child,
    clientMutationId: 'message-request-004',
    enrollmentId: '10000000-0000-4000-8000-000000000050',
    staffUserId: '10000000-0000-4000-8000-000000000012',
    topic: 'access',
  }).success, true);
  assert.equal(sendFamilyMessageSchema.safeParse({
    body: 'unsafe\u0000payload',
    clientMutationId: 'message-request-005',
    threadId: ids.thread,
  }).success, false);
});

test('school announcements accept only normalized plain text and opaque mutation input', () => {
  const parsed = publishSchoolAnnouncementSchema.parse({
    body: '  Family math night starts at 6 PM.  ',
    clientMutationId: 'announcement-publish-001',
    schoolId: ids.school,
    title: '  Family math night  ',
  });
  assert.equal(parsed.title, 'Family math night');
  assert.equal(parsed.body, 'Family math night starts at 6 PM.');
  assert.equal(publishSchoolAnnouncementSchema.parse({
    ...parsed,
    title: 'Cafe\u0301 familiar',
  }).title, 'Café familiar');
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    tenantId: ids.tenant,
  }).success, false);
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    body: 'unsafe\u0000body',
  }).success, false);
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    body: 'unsafe\nbody',
  }).success, false);
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    title: 'unsafe\ttitle',
  }).success, false);
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    title: 'x'.repeat(201),
  }).success, false);
  assert.equal(publishSchoolAnnouncementSchema.safeParse({
    ...parsed,
    body: 'x'.repeat(2_001),
  }).success, false);
});

test('LearningEventV2 accepts client evidence but rejects client authority and duplicates', () => {
  const event = {
    activeDurationMs: 12_000,
    assignmentId: ids.assignment,
    attemptNumber: 1,
    clientMutationId: 'learning-event-request-001',
    clientVersion: 'web-2026.08.23',
    contentReleaseId: 'content-release-v1',
    eventId: '10000000-0000-4000-8000-000000000090',
    eventType: 'page_reviewed',
    idempotencyKey: 'event-idempotency-001',
    learningObjectVersionId: 'course-g04-l03-fq-001-v1',
    lessonReleaseId: 'course-g04-l03-release-v1',
    locale: 'en',
    occurredAt: '2026-08-22T10:30:00.000Z',
    outcome: 'completed',
    sessionId: ids.session,
    skillId: 'skill-patterns-v1',
  } as const;
  assert.equal(learningEventV2BatchSchema.safeParse({events: [event]}).success, true);
  for (const authority of [
    {actorId: 'forged'},
    {studentId: ids.child},
    {tenantId: ids.tenant},
  ]) assert.equal(learningEventV2BatchSchema.safeParse({
    events: [{...event, ...authority}],
  }).success, false);
  assert.equal(learningEventV2BatchSchema.safeParse({events: [event, event]}).success, false);
  assert.equal(learningEventV2BatchSchema.safeParse({events: [
    event,
    {
      ...event,
      assignmentId: '10000000-0000-4000-8000-000000000099',
      eventId: '10000000-0000-4000-8000-000000000091',
    },
  ]}).success, false);
});

test('Family Portal feature flags fail closed and preserve dependency order', () => {
  assert.deepEqual(readFamilyFeatureFlags({NODE_ENV: 'development'}), {
    emailNotificationsEnabled: false,
    messagingEnabled: false,
    portalEnabled: false,
    syntheticDemoEnabled: false,
  });
  assert.deepEqual(readFamilyFeatureFlags({
    FAMILY_EMAIL_NOTIFICATIONS_ENABLED: 'true',
    FAMILY_MESSAGING_ENABLED: 'true',
    FAMILY_PORTAL_ENABLED: 'true',
    FAMILY_SYNTHETIC_DEMO_ENABLED: 'true',
    NODE_ENV: 'development',
  }), {
    emailNotificationsEnabled: true,
    messagingEnabled: true,
    portalEnabled: true,
    syntheticDemoEnabled: true,
  });
  assert.equal(readFamilyFeatureFlags({
    FAMILY_SYNTHETIC_DEMO_ENABLED: 'true',
    FAMILY_PORTAL_ENABLED: 'true',
    NODE_ENV: 'production',
  }).syntheticDemoEnabled, false);
  assert.equal(readFamilyFeatureFlags({
    FAMILY_EMAIL_NOTIFICATIONS_ENABLED: 'true',
    FAMILY_MESSAGING_ENABLED: 'false',
    FAMILY_PORTAL_ENABLED: 'true',
  }).emailNotificationsEnabled, false);
});

test('family notification cron requires an exact non-empty bearer secret', () => {
  assert.equal(matchesFamilyCronBearer('Bearer cron-secret', 'cron-secret'), true);
  for (const [authorization, secret] of [
    [null, 'cron-secret'],
    ['cron-secret', 'cron-secret'],
    ['Bearer ', 'cron-secret'],
    ['Bearer cron-secret-extra', 'cron-secret'],
    ['Bearer cron-secreu', 'cron-secret'],
    ['Bearer cron-secret', undefined],
  ] as const) assert.equal(matchesFamilyCronBearer(authorization, secret), false);
  assert.equal(isFamilyCronApiPath('/api/cron/family-notifications'), true);
  assert.equal(isFamilyWebhookApiPath('/api/cron/family-notifications'), false);
  assert.equal(isFamilyWebhookApiPath('/api/webhooks/resend'), true);
});

test('notification maintenance remains independent from Family product egress flags', async () => {
  const [deliverySource, proxySource, webhookSource] = await Promise.all([
    readFile(
      new URL('../lib/family/notification-service.server.tsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../proxy.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../app/api/webhooks/resend/route.ts', import.meta.url),
      'utf8',
    ),
  ]);
  assert.ok(
    deliverySource.indexOf("database.rpc('run_family_retention_v1'")
      < deliverySource.indexOf('!flags.portalEnabled || !flags.emailNotificationsEnabled'),
  );
  assert.match(deliverySource, /retentionResultSchema\.safeParse\(retention\.data\)/u);
  assert.match(proxySource, /if \(isFamilyCronApiPath\(pathname\)\) \{[\s\S]*?return true;/u);
  assert.match(proxySource, /if \(isFamilyWebhookApiPath\(pathname\)\) \{[\s\S]*?return true;/u);
  assert.doesNotMatch(webhookSource, /emailNotificationsEnabled|FEATURE_DISABLED/u);
  assert.match(webhookSource, /new Webhook\(webhookSecret\)\.verify/u);
});

test('the Mailpit integration transport is loopback-only and synthetic-recipient-only', async () => {
  const [serviceSource, transportSource] = await Promise.all([
    readFile(
      new URL('../lib/family/notification-service.server.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/family/family-email-transport.ts', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(serviceSource, /host:\s*'127\.0\.0\.1'[\s\S]*?port:\s*1_025/u);
  assert.match(serviceSource, /ignoreTLS:\s*true/u);
  assert.match(serviceSource, /disableFileAccess:\s*true/u);
  assert.match(serviceSource, /disableUrlAccess:\s*true/u);
  assert.doesNotMatch(serviceSource, /process\.env\.(?:SMTP_HOST|SMTP_PORT)/u);
  assert.match(transportSource, /configured === 'mailpit-local'[\s\S]*?NODE_ENV !== 'production'/u);
  assert.match(transportSource, /@helpmath\\\.invalid/u);
});

test('only the token-free invitation gateway is exempt from optimistic proxy auth', () => {
  assert.equal(isFamilyInvitationEntryPath('/family/invitations/accept'), true);
  for (const pathname of [
    '/family',
    '/family/invitations',
    '/family/invitations/accept/opaque-token',
    '/teacher/messages',
  ]) assert.equal(isFamilyInvitationEntryPath(pathname), false, pathname);
});

test('governance routes remain inside the protected Family Portal boundary', () => {
  for (const pathname of [
    '/family/requests',
    '/teacher/family-access',
    '/admin/family-operations',
  ]) assert.equal(isFamilyPortalPath(pathname), true, pathname);
});

test('governance mutation inputs are strict, bounded, and resource-scoped', () => {
  assert.equal(createFamilyRightsRequestSchema.safeParse({
    clientMutationId: 'test-rights-request.001',
    details: 'Please review the fictional label.',
    kind: 'correction',
    studentId: ids.child,
  }).success, true);
  assert.equal(createFamilyRightsRequestSchema.safeParse({
    clientMutationId: 'test-rights-request.001',
    details: 'x'.repeat(1_001), kind: 'correction', studentId: ids.child,
  }).success, false);
  assert.equal(createFamilyInvitationSuggestionSchema.safeParse({
    clientMutationId: 'test-suggestion.001', note: '', studentId: ids.child,
  }).success, true);
  assert.equal(createFamilySupportAccessRequestSchema.safeParse({
    clientMutationId: 'test-support.001',
    reason: 'Investigate one exact thread.', threadId: ids.thread,
  }).success, true);
  assert.equal(decideFamilySupportAccessRequestSchema.safeParse({
    approved: true, clientMutationId: 'test-support-decision.001',
    decisionNote: '', requestId: ids.invitation,
  }).success, true);
  assert.equal(redactFamilyMessageSchema.safeParse({
    clientMutationId: 'test-redact.001', messageId: ids.message,
    reason: 'Documented synthetic complaint.', tenantId: ids.tenant,
  }).success, false);
});

test('governance DTOs expose bounded workflow state but no provider or raw audit context', () => {
  const governance = {
    accountActivity: [{
      action: 'inserted', entityType: 'family_rights_request',
      id: ids.message, occurredAt: '2026-08-24T10:00:00.000Z',
    }],
    rightsRequests: [{
      childDisplayName: 'Maya R.', childId: ids.child, decidedAt: null,
      details: 'Please review the fictional label.', id: ids.invitation,
      kind: 'correction', status: 'pending',
      submittedAt: '2026-08-24T10:00:00.000Z',
    }],
    tenant: {displayName: 'North Valley Demo District', id: ids.tenant},
  } as const;
  assert.equal(familyGovernanceWorkspaceDtoSchema.safeParse(governance).success, true);
  assert.equal(familyGovernanceWorkspaceDtoSchema.safeParse({
    ...governance, providerSubject: 'forbidden-subject',
  }).success, false);

  const teacher = {
    eligibleChildren: [{displayName: 'Maya R.', gradeLabel: 'Grade 4',
      id: ids.child, schoolName: 'Willow Creek School'}],
    suggestions: [{childDisplayName: 'Maya R.', childId: ids.child,
      decidedAt: null, id: ids.invitation, note: null, status: 'pending',
      submittedAt: '2026-08-24T10:00:00.000Z'}],
    tenant: governance.tenant,
  } as const;
  assert.equal(teacherInvitationSuggestionWorkspaceDtoSchema.safeParse(teacher).success, true);

  const operations = {
    invitationSuggestions: [{...teacher.suggestions[0], teacherLabel: 'Ms. Rivera'}],
    rightsRequests: [{...governance.rightsRequests[0], guardianLabel: 'Verified guardian'}],
    supportRequests: [{
      accessExpiresAt: null, canAccess: false, decidedAt: null,
      decisionNote: null, id: ids.guardianLink,
      reason: 'Investigate one exact thread.',
      requestedAt: '2026-08-24T10:00:00.000Z',
      requestorLabel: 'Drew School Admin', status: 'pending', threadId: ids.thread,
    }], tenant: governance.tenant,
  } as const;
  assert.equal(adminFamilyOperationsWorkspaceDtoSchema.safeParse(operations).success, true);
  assert.equal(adminFamilyOperationsWorkspaceDtoSchema.safeParse({
    ...operations, supportRequests: [{...operations.supportRequests[0],
      messageBody: 'forbidden'}],
  }).success, false);
});

test('support case DTO is exact-thread and never accepts recipient or provider metadata', () => {
  const supportCase = {
    request: {accessExpiresAt: '2026-08-24T10:15:00.000Z',
      id: ids.guardianLink, reason: 'Synthetic incident review.'},
    tenantDisplayName: 'Cedar Valley Learning District',
    tenantId: ids.tenant,
    thread: {childLabel: 'Maya R.', guardianLabel: 'Verified guardian',
      id: ids.thread, messages: [{body: '[redacted]', id: ids.message,
        redacted: true, senderLabel: 'Ms. Rivera',
        sentAt: '2026-08-24T10:00:00.000Z'}],
      staffLabel: 'Ms. Rivera', status: 'open', topic: 'technical'},
  } as const;
  assert.equal(familySupportCaseDtoSchema.safeParse(supportCase).success, true);
  assert.equal(familySupportCaseDtoSchema.safeParse({
    ...supportCase, recipientEmail: 'adult@example.test',
  }).success, false);
});

test('family DTO is an allowlist and never accepts provider, roster, raw-event, or peer-guardian fields', () => {
  const workspace = validWorkspace();
  assert.equal(familyWorkspaceDtoSchema.safeParse(workspace).success, true);
  for (const forbidden of [
    {providerSubject: 'provider-user-123'},
    {rawEventPayload: {answer: 'sensitive'}},
    {rosterId: 'district-roster-id'},
    {otherGuardianEmail: 'other@example.org'},
  ]) assert.equal(familyWorkspaceDtoSchema.safeParse({
    ...workspace,
    ...forbidden,
  }).success, false);
  assert.equal(familyWorkspaceDtoSchema.safeParse({
    ...workspace,
    assignments: [{...assignment(), lessonHref: 'https://example.org/unsafe'}],
  }).success, false);
  assert.equal(familyWorkspaceDtoSchema.safeParse({
    ...workspace,
    messageContacts: [{
      ...workspace.messageContacts[0],
      childId: '10000000-0000-4000-8000-000000000099',
    }],
  }).success, false);
  assert.equal(familyWorkspaceDtoSchema.safeParse({
    ...workspace,
    messageContacts: [{
      ...workspace.messageContacts[0],
      staffDisplayName: 'teacher@example.org',
    }],
  }).success, false);
});

test('teacher and admin read DTOs are strict, bounded, and contact-safe', () => {
  const teacher = validTeacherInbox();
  const announcementSchools = validTeacherAnnouncementSchools();
  const admin = validAdminWorkspace();
  assert.equal(teacherFamilyInboxDtoSchema.safeParse(teacher).success, true);
  assert.equal(
    teacherAnnouncementSchoolsDtoSchema.safeParse(announcementSchools).success,
    true,
  );
  assert.equal(adminFamilyAccessWorkspaceDtoSchema.safeParse(admin).success, true);
  assert.equal(teacherFamilyInboxDtoSchema.safeParse({
    ...teacher,
    providerSubject: 'forbidden-provider-subject',
  }).success, false);
  assert.equal(teacherAnnouncementSchoolsDtoSchema.safeParse({
    ...announcementSchools,
    schools: [{...announcementSchools.schools[0], rosterId: 'forbidden'}],
  }).success, false);
  assert.equal(teacherAnnouncementSchoolsDtoSchema.safeParse({
    ...announcementSchools,
    schools: [announcementSchools.schools[0], announcementSchools.schools[0]],
  }).success, false);
  assert.equal(teacherFamilyInboxDtoSchema.safeParse({
    ...teacher,
    threads: [{...teacher.threads[0], guardianLabel: 'adult@example.org'}],
  }).success, false);
  assert.equal(adminFamilyAccessWorkspaceDtoSchema.safeParse({
    ...admin,
    invitations: [{
      ...admin.invitations[0],
      destinationLabel: 'adult@example.org',
    }],
  }).success, false);
  assert.equal(adminFamilyAccessWorkspaceDtoSchema.safeParse({
    ...admin,
    invitations: [{...admin.invitations[0], guardianLinkId: null}],
  }).success, false);
});

test('authorized UI adapters preserve opaque resources and never reuse demo records', () => {
  const workspace = familyWorkspaceDtoSchema.parse(validWorkspace());
  const family = getAuthorizedFamilyPortalData('en', workspace);
  assert.equal(family.synthetic, false);
  assert.equal(family.demoKind, 'authorized-family-portal');
  assert.equal(family.selectedChild.id, ids.child);
  assert.equal(family.selectedChild.messages[0]?.id, ids.thread);
  assert.equal(family.selectedChild.messages[0]?.history.length, 2);
  assert.equal(family.selectedChild.messages[0]?.history[1]?.redacted, true);
  assert.equal(family.selectedChild.messages[0]?.history[1]?.body, '[Message removed]');
  assert.equal(family.selectedChild.announcements[0]?.id, ids.announcement);
  assert.equal(family.messageContacts[0]?.staffUserId, ids.teacher);
  assert.equal(family.notificationPreference.messageEmailEnabled, true);
  assert.equal(family.copy.syntheticBadge, 'Authorized access');
  assert.doesNotMatch(family.copy.syntheticBody, /fictional|synthetic demo/iu);

  const teacher = getAuthorizedTeacherMessagesData(
    'es',
    teacherFamilyInboxDtoSchema.parse(validTeacherInbox()),
    teacherAnnouncementSchoolsDtoSchema.parse(validTeacherAnnouncementSchools()),
  );
  assert.equal(teacher.synthetic, false);
  assert.equal(teacher.threads[0]?.id, ids.thread);
  assert.equal(teacher.threads[0]?.subject, 'Progreso de aprendizaje');
  assert.equal(teacher.announcementPublishingAvailable, true);
  assert.equal(teacher.announcementSchools[0]?.id, ids.school);
  assert.equal(teacher.publishAnnouncement, 'Publicar anuncio');

  const mismatchedAnnouncementTenant = getAuthorizedTeacherMessagesData(
    'en',
    teacherFamilyInboxDtoSchema.parse(validTeacherInbox()),
    teacherAnnouncementSchoolsDtoSchema.parse({
      ...validTeacherAnnouncementSchools(),
      tenant: {
        displayName: 'Another synthetic tenant',
        id: '20000000-0000-4000-8000-000000000001',
      },
    }),
  );
  assert.equal(mismatchedAnnouncementTenant.announcementPublishingAvailable, false);
  assert.deepEqual(mismatchedAnnouncementTenant.announcementSchools, []);

  const admin = getAuthorizedAdminFamilyAccessData(
    'en',
    adminFamilyAccessWorkspaceDtoSchema.parse(validAdminWorkspace()),
  );
  assert.equal(admin.synthetic, false);
  assert.equal(admin.invitationCreationEnabled, false);
  assert.equal(admin.invitations[0]?.guardianLinkId, ids.guardianLink);
  assert.equal(admin.invitations[0]?.destinationLabel, 'Verified adult ••••');

  const integrationAdmin = getAuthorizedAdminFamilyAccessData(
    'en',
    adminFamilyAccessWorkspaceDtoSchema.parse(validAdminWorkspace()),
    {
      invitationCreationEnabled: true,
      invitationRecipientPolicy: 'synthetic-invalid-only',
    },
  );
  assert.equal(integrationAdmin.invitationCreationEnabled, true);
  assert.equal(integrationAdmin.adultEmailPlaceholder, 'adult@helpmath.invalid');
  assert.match(integrationAdmin.adultEmailHint, /exact @helpmath\.invalid/u);
  assert.doesNotMatch(integrationAdmin.createIntro, /real|production/iu);

  const productionAdmin = getAuthorizedAdminFamilyAccessData(
    'en',
    adminFamilyAccessWorkspaceDtoSchema.parse(validAdminWorkspace()),
    {
      invitationCreationEnabled: true,
      invitationRecipientPolicy: 'school-verified-production',
    },
  );
  assert.equal(productionAdmin.invitationRecipientPolicy,
    'school-verified-production');
  assert.equal(productionAdmin.adultEmailPlaceholder,
    'adult@family-domain.org');
  assert.match(productionAdmin.createTitle, /school-verified/u);
  assert.doesNotMatch(productionAdmin.adultEmailHint, /helpmath\.invalid/u);
});

test('non-synthetic Family pages use authorized RPC repositories and retain fail-closed routing', async () => {
  const [
    familyPage,
    familyPortal,
    familyRepository,
    teacherPage,
    adminPage,
    teacherRepository,
    teacherAnnouncementRepository,
    adminRepository,
    actionsSource,
    companionSource,
  ] =
    await Promise.all([
      readFile(new URL('../app/[locale]/family/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/family/family-portal.tsx', import.meta.url), 'utf8'),
      readFile(
        new URL('../lib/family/family-repository.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../app/[locale]/teacher/messages/page.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../app/[locale]/admin/family-access/page.tsx', import.meta.url), 'utf8'),
      readFile(
        new URL('../lib/family/teacher-family-repository.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../lib/family/teacher-announcement-repository.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../lib/family/admin-family-access-repository.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../lib/family/actions.ts', import.meta.url), 'utf8'),
      readFile(
        new URL('../components/family/family-companion-surfaces.tsx', import.meta.url),
        'utf8',
      ),
    ]);
  assert.match(familyPage, /await readFamilyWorkspace\(selectedChildId\)/u);
  assert.match(familyPage, /createThreadFromFamilyPortal[\s\S]*?sendFamilyMessage\(\{[\s\S]*?childId,[\s\S]*?enrollmentId,[\s\S]*?staffUserId,[\s\S]*?topic/u);
  assert.match(
    familyPage,
    /const messagingEnabled = flags\.messagingEnabled && context\.messagingEnabled/u,
  );
  assert.match(familyPage, /onCreateThreadAction=\{messagingEnabled/u);
  assert.match(familyRepository, /family_workspace_for_tenant_v1/u);
  assert.match(familyRepository, /p_tenant_id: context\.currentTenantId/u);
  assert.doesNotMatch(familyRepository, /family_workspace_v1/u);
  assert.match(familyPortal, /data\.messageContacts\.find/u);
  assert.match(familyPortal, /FAMILY_MESSAGE_TOPICS\.map/u);
  assert.match(familyPortal, /maxLength=\{2_000\}/u);
  assert.match(familyPortal, /announcement-private-reply:/u);
  assert.match(familyPortal, /contact\.staffUserId,[\s\S]*?'other',[\s\S]*?body/u);
  assert.match(familyPortal, /message\.history\.map/u);
  assert.match(actionsSource, /familyMessageReceiptSchema\.safeParse\(result\.data\)/u);
  assert.doesNotMatch(actionsSource, /result\.data as \{message_id/u);
  assert.match(
    actionsSource,
    /update_family_notification_preferences_for_tenant_v1/u,
  );
  assert.match(actionsSource, /p_tenant_id: context\.currentTenantId/u);
  assert.doesNotMatch(actionsSource, /export async function recordLearningEventsV2/u);
  assert.match(teacherPage, /await readTeacherFamilyInbox\(\)/u);
  assert.match(teacherPage, /await readTeacherAnnouncementSchools\(\)/u);
  assert.match(teacherPage, /onPublishAnnouncementAction=\{data\.announcementPublishingAvailable/u);
  assert.match(adminPage, /await readAdminFamilyAccessWorkspace\(\)/u);
  assert.match(adminPage, /isFamilyInvitationIssuerConfigurationReady\(\)/u);
  assert.match(adminPage,
    /isFamilyInvitationRecipientPolicyEnabled\(context\.dataMode\)/u);
  assert.match(adminPage, /readFamilyAuthProviderMode\(\) === 'supabase'/u);
  assert.match(adminPage, /transport === 'resend'/u);
  assert.match(adminPage, /flags\.emailNotificationsEnabled/u);
  assert.match(adminPage, /resendGuardianInvitation/u);
  assert.match(adminPage, /onResendInvitationAction=\{invitationCreationEnabled/u);
  for (const page of [familyPage, teacherPage, adminPage]) {
    assert.doesNotMatch(page, /if \(!context\.synthetic\) notFound\(\)/u);
    assert.match(page, /handleFamilyPageAccessError/u);
  }
  assert.match(teacherRepository, /teacher_family_inbox_for_tenant_v1/u);
  assert.match(
    teacherAnnouncementRepository,
    /teacher_announcement_schools_for_tenant_v1/u,
  );
  assert.match(teacherRepository, /p_tenant_id: context\.currentTenantId/u);
  assert.match(
    teacherAnnouncementRepository,
    /p_tenant_id: context\.currentTenantId/u,
  );
  assert.match(
    adminRepository,
    /admin_family_access_workspace_for_tenant_v1/u,
  );
  assert.match(adminRepository, /p_tenant_id: context\.currentTenantId/u);
  for (const repository of [
    teacherRepository,
    teacherAnnouncementRepository,
    adminRepository,
  ]) {
    assert.match(repository, /result\.error\.code === '42501'/u);
    assert.match(repository, /result\.error\.code === 'P0002'/u);
    assert.match(repository, /parsed\.data\.tenant\.id !== context\.currentTenantId/u);
    assert.doesNotMatch(repository, /createFamilyServiceClient|SUPABASE_SERVICE_ROLE_KEY/u);
  }
  assert.match(actionsSource, /publishSchoolAnnouncementSchema\.safeParse\(input\)/u);
  assert.match(actionsSource, /authorize_school_announcement_publish_v1/u);
  assert.match(actionsSource, /publish_school_announcement_v1/u);
  assert.match(actionsSource, /announcementPublishReceiptSchema\.safeParse\(result\.data\)/u);
  assert.match(companionSource, /maxLength=\{200\}/u);
  assert.match(companionSource, /maxLength=\{2_000\}/u);
  assert.match(companionSource, /data\.announcementPrivacyNote/u);
});

test('service-role credential access stays isolated from ordinary Family request modules', async () => {
  const [requestClientSource, serviceClientSource, notificationSource] =
    await Promise.all([
      readFile(
        new URL('../lib/family/supabase.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../lib/family/supabase-service.server.ts', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../lib/family/notification-service.server.tsx', import.meta.url),
        'utf8',
      ),
    ]);
  assert.doesNotMatch(
    requestClientSource,
    /SUPABASE_SERVICE_ROLE_KEY|createFamilyServiceClient/u,
  );
  assert.match(serviceClientSource, /SUPABASE_SERVICE_ROLE_KEY/u);
  assert.match(serviceClientSource, /createFamilyServiceClient/u);
  assert.match(
    notificationSource,
    /from ['"]\.\/supabase-service\.server['"]/u,
  );
  assert.doesNotMatch(notificationSource, /from ['"]\.\/supabase\.server['"]/u);
  for (const relativePath of [
    '../lib/family/actions.ts',
    '../lib/family/authorization.server.ts',
    '../lib/family/family-repository.server.ts',
    '../lib/family/teacher-family-repository.server.ts',
    '../lib/family/teacher-announcement-repository.server.ts',
    '../lib/family/admin-family-access-repository.server.ts',
    '../lib/family/resend-webhook-writer.server.ts',
    '../app/api/webhooks/resend/route.ts',
    '../components/privacy-safe-analytics.tsx',
  ]) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY/u, relativePath);
    assert.doesNotMatch(source, /createFamilyServiceClient/u, relativePath);
  }
});

test('invitation retries and acceptance receipts fail closed at the server action boundary', async () => {
  const actionsSource = await readFile(
    new URL('../lib/family/actions.ts', import.meta.url),
    'utf8',
  );
  assert.match(
    actionsSource,
    /guardianInvitationAcceptanceReceiptSchema\s*=\s*z\.array\([\s\S]*?\)\.length\(1\)/u,
  );
  assert.match(
    actionsSource,
    /guardianInvitationAcceptanceReceiptSchema\.safeParse\(\s*result\.data/u,
  );
  assert.match(
    actionsSource,
    /if \(!accepted\.success\) return failure\('INVITATION_INVALID'\)/u,
  );
  assert.match(actionsSource, /alreadyIssued:\s*z\.boolean\(\)/u);
  assert.match(
    actionsSource,
    /invitationExpiresAt:\s*z\.iso\.datetime\(\{offset:\s*true\}\)\.nullable\(\)/u,
  );
  assert.equal(
    actionsSource.match(/if \(authorized\.data\.alreadyIssued\)/gu)?.length,
    2,
  );
  assert.equal(
    actionsSource.match(/if \(!authorized\.data\.invitationExpiresAt\) return failure\('RETRY_LATER'\)/gu)?.length,
    2,
  );
});

test('invitation delivery keeps the one-use token out of HTTP request URLs', async () => {
  const [deliverySource, secretSource, actionSource, webhookWriterSource] = await Promise.all([
    readFile(
      new URL('../lib/family/notification-service.server.tsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/family/invitation-secret.server.ts', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../lib/family/actions.ts', import.meta.url), 'utf8'),
    readFile(
      new URL('../lib/family/resend-webhook-writer.server.ts', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(deliverySource, /link\.hash\s*=\s*`token=/u);
  assert.doesNotMatch(deliverySource, /searchParams\.set\(['"]token['"]/u);
  assert.match(secretSource, /randomBytes\(32\)/u);
  assert.match(secretSource, /createHash\(['"]sha256['"]\)/u);
  assert.match(secretSource, /createHmac\(['"]sha256['"], familyEmailDigestKey\(\)\)/u);
  assert.match(secretSource, /FAMILY_EMAIL_DIGEST_KEY/u);
  assert.match(secretSource, /aes-256-gcm/u);
  assert.match(actionSource, /p_token_digest:\s*digestGuardianInvitationToken/u);
  assert.doesNotMatch(actionSource, /console\.|logger\.|JSON\.stringify\(token/u);
  assert.match(deliverySource, /recipient_email_ciphertext/u);
  assert.match(deliverySource, /decryptFamilyEmailFromStorage/u);
  assert.doesNotMatch(deliverySource, /to:\s*row\.recipient_email\b/u);
  assert.match(deliverySource, /enqueue_weekly_family_digests_v1/u);
  assert.match(deliverySource, /run_family_retention_v1/u);
  assert.match(deliverySource, /validate_family_notification_claim_v1/u);
  assert.match(deliverySource, /complete_family_notification_outbox_v1/u);
  assert.match(webhookWriterSource, /record_family_email_delivery_event_v1/u);
  assert.match(deliverySource, /p_claim_token:\s*row\.claim_token/u);
  assert.doesNotMatch(deliverySource, /\.from\(['"]notification_outbox['"]\)\s*\.update/u);
});

test('public Resend webhook uses only the dedicated least-privilege writer token', async () => {
  const [writerSource, routeSource, serviceSource] = await Promise.all([
    readFile(
      new URL('../lib/family/resend-webhook-writer.server.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../app/api/webhooks/resend/route.ts', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../lib/family/supabase-service.server.ts', import.meta.url),
      'utf8',
    ),
  ]);
  assert.match(writerSource, /FAMILY_WEBHOOK_WRITER_JWT/u);
  assert.match(writerSource, /role:\s*z\.literal\('family_webhook_writer'\)/u);
  assert.match(writerSource, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/u);
  assert.match(writerSource, /LOOPBACK_HOSTS\.has\(baseUrl\.hostname\)/u);
  assert.match(writerSource, /baseUrl\.pathname !== '\/'/u);
  assert.match(writerSource, /Prefer:\s*'return=minimal'/u);
  assert.match(writerSource, /response\.status !== 204/u);
  assert.doesNotMatch(writerSource, /SUPABASE_SERVICE_ROLE_KEY|createFamilyServiceClient/u);
  assert.match(routeSource, /resend-webhook-writer\.server/u);
  assert.doesNotMatch(routeSource, /notification-service\.server|SUPABASE_SERVICE_ROLE_KEY/u);
  assert.match(routeSource, /from 'standardwebhooks'/u);
  assert.match(routeSource, /MAX_WEBHOOK_BODY_BYTES/u);
  assert.doesNotMatch(routeSource, /RESEND_API_KEY/u);
  assert.match(
    serviceSource,
    /Reserved for the authorized notification\/retention cron worker/u,
  );
});

test('protected Family routes declare dynamic no-store and privacy-safe telemetry contracts', async () => {
  const [nextConfig, familyLayout, analytics, authRoute] = await Promise.all([
    readFile(new URL('../next.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../app/[locale]/family/layout.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/privacy-safe-analytics.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../app/api/auth/session/route.ts', import.meta.url), 'utf8'),
  ]);
  assert.match(nextConfig, /private, no-store, max-age=0/u);
  for (const route of [
    '/family/:path*',
    '/teacher/messages/:path*',
    '/admin/family-access/:path*',
  ]) assert.match(nextConfig, new RegExp(route.replaceAll('*', '\\*'), 'u'));
  assert.match(familyLayout, /dynamic = 'force-dynamic'/u);
  assert.match(familyLayout, /fetchCache = 'force-no-store'/u);
  assert.match(familyLayout, /revalidate = 0/u);
  for (const prefix of ['/family', '/teacher/messages', '/admin/family-access']) {
    assert.match(analytics, new RegExp(`'${prefix.replace('/', '\\/')}'`, 'u'));
  }
  assert.doesNotMatch(authRoute, /provider:\s*session\.provider/u);
});
