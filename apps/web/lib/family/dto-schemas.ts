import {z} from 'zod';

import {
  FAMILY_ASSIGNMENT_STATUSES,
  FAMILY_INVITATION_SUGGESTION_STATUSES,
  FAMILY_MESSAGE_TOPICS,
  FAMILY_REVIEW_STATUSES,
  FAMILY_RIGHTS_REQUEST_KINDS,
  FAMILY_SKILL_BANDS,
  FAMILY_SUPPORT_ACCESS_STATUSES,
  FAMILY_THREAD_STATUSES,
} from './types';

const uuid = z.uuid();
const iso = z.iso.datetime({offset: true});
const nullableIso = iso.nullable();
const safeLabel = z.string().min(1).max(160).refine(
  (value) => !/[\p{Cc}\p{Cf}]/u.test(value),
  {message: 'Labels cannot contain control characters.'},
);
const privacySafeAdultLabel = safeLabel.refine(
  (value) => !value.includes('@') && !/\b[0-9a-f]{64}\b/iu.test(value),
  {message: 'Adult labels cannot expose email addresses or digests.'},
);

const childSchema = z.object({
  dataUpdatedAt: nullableIso,
  displayName: z.string().min(1).max(120),
  gradeLabel: z.string().min(1).max(40),
  id: uuid,
  linkStatus: z.literal('active'),
  schoolName: z.string().min(1).max(160),
}).strict();

const assignmentSchema = z.object({
  assignedAt: iso,
  dueAt: nullableIso,
  familyNote: z.string().max(500).nullable(),
  id: uuid,
  lessonReleaseId: z.string().min(1).max(160),
  lessonTitle: z.string().min(1).max(200),
  reviewedPages: z.number().int().min(0),
  status: z.enum(FAMILY_ASSIGNMENT_STATUSES),
  teacherDisplayName: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  totalPages: z.number().int().min(1),
}).strict().refine(
  (value) => value.reviewedPages <= value.totalPages,
  {message: 'Reviewed pages cannot exceed total pages.'},
);

const lessonSchema = z.object({
  assignmentId: uuid.nullable(),
  computedAt: iso,
  lastActivityAt: nullableIso,
  lessonReleaseId: z.string().min(1).max(160),
  lessonTitle: z.string().min(1).max(200),
  projectionVersion: z.literal('progress_projection_v1'),
  reviewedPages: z.number().int().min(0),
  stale: z.boolean(),
  totalPages: z.number().int().min(1),
}).strict().refine(
  (value) => value.reviewedPages <= value.totalPages,
  {message: 'Reviewed pages cannot exceed total pages.'},
);

const skillSchema = z.object({
  band: z.enum(FAMILY_SKILL_BANDS),
  computedAt: iso,
  evidenceCount: z.number().int().min(0),
  explanation: z.string().min(1).max(500),
  projectionVersion: z.literal('skill_projection_v1'),
  skillId: z.string().min(1).max(160),
  skillName: z.string().min(1).max(160),
  stale: z.boolean(),
  windowEndsAt: iso,
  windowStartsAt: iso,
}).strict();

const messageSchema = z.object({
  body: z.string().max(2_000),
  id: uuid,
  mine: z.boolean(),
  redacted: z.boolean(),
  senderLabel: z.string().min(1).max(120),
  sentAt: iso,
}).strict();

const threadSchema = z.object({
  childId: uuid,
  id: uuid,
  lastMessageAt: iso,
  messages: z.array(messageSchema).max(200),
  participantLabel: z.string().min(1).max(120),
  status: z.enum(FAMILY_THREAD_STATUSES),
  topic: z.enum(FAMILY_MESSAGE_TOPICS),
  unreadCount: z.number().int().min(0),
}).strict();

const messageContactSchema = z.object({
  childId: uuid,
  enrollmentId: uuid,
  staffDisplayName: privacySafeAdultLabel,
  staffUserId: uuid,
}).strict();

const announcementSchema = z.object({
  body: z.string().min(1).max(2_000),
  id: uuid,
  publishedAt: iso,
  publisherLabel: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
}).strict();

export const familyWorkspaceDtoSchema = z.object({
  assignments: z.array(assignmentSchema).max(500),
  children: z.array(childSchema).min(1).max(100),
  lessons: z.array(lessonSchema).max(500),
  messageContacts: z.array(messageContactSchema).max(50),
  notificationPreference: z.object({
    messageEmailEnabled: z.boolean(),
    weeklyDigestEnabled: z.boolean(),
  }).strict(),
  overview: z.object({
    announcements: z.array(announcementSchema).max(500),
    assignments: z.array(assignmentSchema).max(500),
    completedLessonPagesThisWeek: z.number().int().min(0),
    dataUpdatedAt: nullableIso,
    growingSkills: z.array(skillSchema).max(3),
    latestActivityAt: nullableIso,
    supportActivity: z.object({
      description: z.string().min(1).max(800),
      source: z.enum(['teacher', 'approved_curriculum']),
      title: z.string().min(1).max(200),
    }).strict().nullable(),
    unreadMessageCount: z.number().int().min(0),
  }).strict(),
  selectedChildId: uuid,
  skills: z.array(skillSchema).max(500),
  tenant: z.object({
    displayName: z.string().min(1).max(160),
    id: uuid,
  }).strict(),
  threads: z.array(threadSchema).max(500),
}).strict().superRefine((value, context) => {
  const childIds = value.children.map((child) => child.id);
  if (!childIds.includes(value.selectedChildId)) {
    context.addIssue({
      code: 'custom',
      message: 'The selected child must be included in the child allowlist.',
      path: ['selectedChildId'],
    });
  }
  if (new Set(childIds).size !== childIds.length) {
    context.addIssue({
      code: 'custom',
      message: 'Child identifiers must be unique.',
      path: ['children'],
    });
  }
  value.threads.forEach((thread, index) => {
    if (thread.childId !== value.selectedChildId) {
      context.addIssue({
        code: 'custom',
        message: 'A family thread must belong to the selected child.',
        path: ['threads', index, 'childId'],
      });
    }
  });
  const contactKeys = new Set<string>();
  value.messageContacts.forEach((contact, index) => {
    if (contact.childId !== value.selectedChildId) {
      context.addIssue({
        code: 'custom',
        message: 'A message contact must belong to the selected child.',
        path: ['messageContacts', index, 'childId'],
      });
    }
    const key = `${contact.enrollmentId}:${contact.staffUserId}`;
    if (contactKeys.has(key)) {
      context.addIssue({
        code: 'custom',
        message: 'Message contacts must be unique.',
        path: ['messageContacts', index],
      });
    }
    contactKeys.add(key);
  });
});

const teacherInboxMessageSchema = z.object({
  body: z.string().min(1).max(2_000).refine(
    (value) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(value),
    {message: 'Message body contains a forbidden control character.'},
  ),
  id: uuid,
  mine: z.boolean(),
  senderLabel: safeLabel,
  sentAt: iso,
}).strict();

const teacherInboxThreadSchema = z.object({
  childId: uuid,
  childLabel: safeLabel,
  gradeLabel: z.string().min(1).max(40),
  guardianLabel: privacySafeAdultLabel,
  id: uuid,
  messages: z.array(teacherInboxMessageSchema).max(200),
  status: z.enum(FAMILY_THREAD_STATUSES),
  topic: z.enum(FAMILY_MESSAGE_TOPICS),
  unreadCount: z.number().int().min(0).max(200),
}).strict();

export const teacherFamilyInboxDtoSchema = z.object({
  tenant: z.object({
    displayName: safeLabel,
    id: uuid,
  }).strict(),
  threads: z.array(teacherInboxThreadSchema).max(500),
}).strict();

export const teacherAnnouncementSchoolsDtoSchema = z.object({
  schools: z.array(z.object({
    displayName: safeLabel,
    id: uuid,
  }).strict()).min(1).max(100),
  tenant: z.object({
    displayName: safeLabel,
    id: uuid,
  }).strict(),
}).strict().superRefine((value, context) => {
  const ids = value.schools.map((school) => school.id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({
      code: 'custom',
      message: 'Announcement schools must be unique.',
      path: ['schools'],
    });
  }
});

const adminFamilyAccessChildSchema = z.object({
  displayName: safeLabel,
  gradeLabel: z.string().min(1).max(40),
  id: uuid,
  schoolName: safeLabel,
}).strict();

const adminFamilyAccessInvitationSchema = z.object({
  childDisplayName: safeLabel,
  childId: uuid,
  destinationLabel: privacySafeAdultLabel,
  expiresAt: nullableIso,
  gradeLabel: z.string().min(1).max(40),
  guardianLabel: privacySafeAdultLabel,
  guardianLinkId: uuid.nullable(),
  id: uuid,
  status: z.enum(['pending', 'accepted', 'revoked']),
}).strict().superRefine((value, context) => {
  if (value.status === 'accepted' && value.guardianLinkId === null) {
    context.addIssue({
      code: 'custom',
      message: 'Accepted access requires an opaque guardian link id.',
      path: ['guardianLinkId'],
    });
  }
  if (value.status !== 'accepted' && value.guardianLinkId !== null) {
    context.addIssue({
      code: 'custom',
      message: 'Only accepted access may expose an opaque guardian link id.',
      path: ['guardianLinkId'],
    });
  }
});

export const adminFamilyAccessWorkspaceDtoSchema = z.object({
  children: z.array(adminFamilyAccessChildSchema).max(5_000),
  invitations: z.array(adminFamilyAccessInvitationSchema).max(10_000),
  tenant: z.object({
    displayName: safeLabel,
    id: uuid,
  }).strict(),
}).strict();

const familyRightsRequestSchema = z.object({
  childDisplayName: safeLabel,
  childId: uuid,
  decidedAt: nullableIso,
  details: z.string().min(1).max(1_000).nullable(),
  id: uuid,
  kind: z.enum(FAMILY_RIGHTS_REQUEST_KINDS),
  status: z.enum(FAMILY_REVIEW_STATUSES),
  submittedAt: iso,
}).strict();

const safeActivityEntity = z.enum([
  'family_rights_request',
  'family_messages',
  'family_threads',
  'family_notification_preferences',
  'guardian_links',
  'guardian_invitations',
]);

export const familyGovernanceWorkspaceDtoSchema = z.object({
  accountActivity: z.array(z.object({
    action: z.enum(['inserted', 'updated', 'deleted']),
    entityType: safeActivityEntity,
    id: uuid,
    occurredAt: iso,
  }).strict()).max(50),
  rightsRequests: z.array(familyRightsRequestSchema).max(200),
  tenant: z.object({displayName: safeLabel, id: uuid}).strict(),
}).strict();

const teacherInvitationSuggestionSchema = z.object({
  childDisplayName: safeLabel,
  childId: uuid,
  decidedAt: nullableIso,
  id: uuid,
  note: z.string().min(1).max(500).nullable(),
  status: z.enum(FAMILY_INVITATION_SUGGESTION_STATUSES),
  submittedAt: iso,
}).strict();

export const teacherInvitationSuggestionWorkspaceDtoSchema = z.object({
  eligibleChildren: z.array(z.object({
    displayName: safeLabel,
    gradeLabel: z.string().min(1).max(40),
    id: uuid,
    schoolName: safeLabel,
  }).strict()).max(500),
  suggestions: z.array(teacherInvitationSuggestionSchema).max(200),
  tenant: z.object({displayName: safeLabel, id: uuid}).strict(),
}).strict();

const adminSupportRequestSchema = z.object({
  accessExpiresAt: nullableIso,
  canAccess: z.boolean(),
  decidedAt: nullableIso,
  decisionNote: z.string().min(1).max(500).nullable(),
  id: uuid,
  reason: z.string().min(1).max(500),
  requestedAt: iso,
  requestorLabel: privacySafeAdultLabel,
  status: z.enum(FAMILY_SUPPORT_ACCESS_STATUSES),
  threadId: uuid,
}).strict();

export const adminFamilyOperationsWorkspaceDtoSchema = z.object({
  invitationSuggestions: z.array(teacherInvitationSuggestionSchema.extend({
    teacherLabel: privacySafeAdultLabel,
  }).strict()).max(500),
  rightsRequests: z.array(familyRightsRequestSchema.extend({
    guardianLabel: privacySafeAdultLabel,
  }).strict()).max(500),
  supportRequests: z.array(adminSupportRequestSchema).max(500),
  tenant: z.object({displayName: safeLabel, id: uuid}).strict(),
}).strict();

export const familySupportCaseDtoSchema = z.object({
  request: z.object({
    accessExpiresAt: iso,
    id: uuid,
    reason: z.string().min(1).max(500),
  }).strict(),
  tenantDisplayName: safeLabel,
  tenantId: uuid,
  thread: z.object({
    childLabel: safeLabel,
    guardianLabel: privacySafeAdultLabel,
    id: uuid,
    messages: z.array(z.object({
      body: z.string().max(2_000),
      id: uuid,
      redacted: z.boolean(),
      senderLabel: safeLabel,
      sentAt: iso,
    }).strict()).max(200),
    staffLabel: privacySafeAdultLabel,
    status: z.enum(FAMILY_THREAD_STATUSES),
    topic: z.enum(FAMILY_MESSAGE_TOPICS),
  }).strict(),
}).strict();
