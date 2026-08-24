import {z} from 'zod';

import {
  FAMILY_INVITATION_SUGGESTION_STATUSES,
  FAMILY_MESSAGE_TOPICS,
  FAMILY_REVIEW_STATUSES,
  FAMILY_RIGHTS_REQUEST_KINDS,
} from './types';

const uuid = z.uuid();
const clientMutationId = z.string().trim().min(8).max(128).regex(
  /^[A-Za-z0-9._:-]+$/u,
  'Use an opaque mutation identifier.',
);

const normalizedText = (maximum: number) => z.string()
  .transform((value) => value.normalize('NFC').trim())
  .pipe(z.string().min(1).max(maximum).refine(
    (value) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value),
    'Control characters are not allowed.',
  ));

const normalizedAnnouncementText = (maximum: number) => z.string()
  .transform((value) => value.normalize('NFC').trim())
  .pipe(z.string().min(1).max(maximum).refine(
    (value) => !/[\u0000-\u001F\u007F]/u.test(value),
    'Control characters are not allowed.',
  ));

const normalizedEmail = z.string().refine(
  (value) => !/[\u0000-\u001F\u007F]/u.test(value),
  'Control characters are not allowed.',
)
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.email());

export const createGuardianInvitationSchema = z.object({
  clientMutationId,
  studentId: uuid,
  verifiedAdultEmail: normalizedEmail,
}).strict();

export const resendGuardianInvitationSchema = z.object({
  clientMutationId,
  invitationId: uuid,
}).strict();

export const revokeGuardianInvitationSchema = z.object({
  clientMutationId,
  invitationId: uuid,
  reason: normalizedText(500),
}).strict();

export const acceptGuardianInvitationSchema = z.object({
  clientMutationId,
  token: z.string().min(43).max(256).regex(/^[A-Za-z0-9_-]+$/u),
}).strict();

export const revokeGuardianLinkSchema = z.object({
  clientMutationId,
  guardianLinkId: uuid,
  reason: normalizedText(500),
}).strict();

export const relinquishGuardianLinkSchema = z.object({
  clientMutationId,
  guardianLinkId: uuid,
}).strict();

export const relinquishGuardianChildAccessSchema = z.object({
  childId: uuid,
  clientMutationId,
}).strict();

export const sendFamilyMessageSchema = z.object({
  body: normalizedText(2_000),
  childId: uuid.optional(),
  clientMutationId,
  enrollmentId: uuid.optional(),
  staffUserId: uuid.optional(),
  threadId: uuid.optional(),
  topic: z.enum(FAMILY_MESSAGE_TOPICS).optional(),
}).strict().superRefine((value, context) => {
  const createsThread = value.threadId === undefined;
  const hasNewThreadFields = Boolean(
    value.childId && value.enrollmentId && value.staffUserId && value.topic,
  );
  if (createsThread !== hasNewThreadFields) {
    context.addIssue({
      code: 'custom',
      message: 'Provide a threadId, or every field required to create a thread.',
      path: ['threadId'],
    });
  }
});

export const markFamilyThreadReadSchema = z.object({
  clientMutationId,
  threadId: uuid,
}).strict();

export const closeFamilyThreadSchema = z.object({
  clientMutationId,
  status: z.literal('closed').default('closed'),
  threadId: uuid,
}).strict();

export const updateFamilyNotificationPreferencesSchema = z.object({
  clientMutationId,
  messageEmailEnabled: z.boolean(),
  weeklyDigestEnabled: z.boolean(),
}).strict();

export const publishSchoolAnnouncementSchema = z.object({
  body: normalizedAnnouncementText(2_000),
  clientMutationId,
  schoolId: uuid,
  title: normalizedAnnouncementText(200),
}).strict();

export const createFamilyRightsRequestSchema = z.object({
  clientMutationId,
  details: z.union([normalizedText(1_000), z.literal('')]).optional(),
  kind: z.enum(FAMILY_RIGHTS_REQUEST_KINDS),
  studentId: uuid,
}).strict();

export const reviewFamilyRightsRequestSchema = z.object({
  clientMutationId,
  requestId: uuid,
  status: z.enum(FAMILY_REVIEW_STATUSES).refine(
    (value) => value !== 'pending',
    'A review must be terminal.',
  ),
}).strict();

export const createFamilyInvitationSuggestionSchema = z.object({
  clientMutationId,
  note: z.union([normalizedText(500), z.literal('')]).optional(),
  studentId: uuid,
}).strict();

export const reviewFamilyInvitationSuggestionSchema = z.object({
  clientMutationId,
  status: z.enum(FAMILY_INVITATION_SUGGESTION_STATUSES).refine(
    (value) => value !== 'pending',
    'A review must be terminal.',
  ),
  suggestionId: uuid,
}).strict();

export const createFamilySupportAccessRequestSchema = z.object({
  clientMutationId,
  reason: normalizedText(500),
  threadId: uuid,
}).strict();

export const decideFamilySupportAccessRequestSchema = z.object({
  approved: z.boolean(),
  clientMutationId,
  decisionNote: z.union([normalizedText(500), z.literal('')]).optional(),
  requestId: uuid,
}).strict();

export const redactFamilyMessageSchema = z.object({
  clientMutationId,
  messageId: uuid,
  reason: normalizedText(500),
}).strict();

export const declineGuardianInvitationSchema = acceptGuardianInvitationSchema;

export const familyChildSelectionSchema = z.object({
  childId: uuid,
}).strict();

export const selectFamilyChildSchema = z.object({
  childId: uuid,
  clientMutationId,
}).strict();

export const learningEventV2Types = [
  'lesson_started',
  'lesson_resumed',
  'page_visited',
  'page_reviewed',
  'support_opened',
  'practice_evaluated',
  'lesson_exited',
] as const;

export const learningEventV2ClientSchema = z.object({
  activeDurationMs: z.number().int().min(0).max(14_400_000),
  assignmentId: uuid,
  occurredAt: z.iso.datetime({offset: true}),
  attemptNumber: z.number().int().min(1).max(10_000),
  clientMutationId,
  clientVersion: z.string().trim().min(1).max(64),
  contentReleaseId: z.string().trim().min(1).max(128),
  eventId: uuid,
  eventType: z.enum(learningEventV2Types),
  idempotencyKey: z.string().trim().min(8).max(160),
  learningObjectVersionId: z.string().trim().min(1).max(160),
  lessonReleaseId: z.string().trim().min(1).max(160),
  locale: z.enum(['en', 'es']),
  outcome: z.enum(['none', 'correct', 'incorrect', 'completed', 'abandoned']),
  sessionId: uuid,
  skillId: z.string().trim().min(1).max(160).nullable(),
}).strict();

export const learningEventV2BatchSchema = z.object({
  events: z.array(learningEventV2ClientSchema).min(1).max(50),
}).strict().superRefine(({events}, context) => {
  const ids = new Set<string>();
  const assignmentId = events[0]?.assignmentId;
  for (const [index, event] of events.entries()) {
    if (ids.has(event.eventId)) {
      context.addIssue({
        code: 'custom',
        message: 'Duplicate eventId in batch.',
        path: ['events', index, 'eventId'],
      });
    }
    if (assignmentId && event.assignmentId !== assignmentId) {
      context.addIssue({
        code: 'custom',
        message: 'A learning event batch must belong to one assignment.',
        path: ['events', index, 'assignmentId'],
      });
    }
    ids.add(event.eventId);
  }
});

export type CreateGuardianInvitationInput = z.infer<
  typeof createGuardianInvitationSchema
>;
export type ResendGuardianInvitationInput = z.infer<
  typeof resendGuardianInvitationSchema
>;
export type AcceptGuardianInvitationInput = z.infer<
  typeof acceptGuardianInvitationSchema
>;
export type RevokeGuardianLinkInput = z.infer<typeof revokeGuardianLinkSchema>;
export type RelinquishGuardianLinkInput = z.infer<
  typeof relinquishGuardianLinkSchema
>;
export type RelinquishGuardianChildAccessInput = z.infer<
  typeof relinquishGuardianChildAccessSchema
>;
export type SendFamilyMessageInput = z.infer<typeof sendFamilyMessageSchema>;
export type MarkFamilyThreadReadInput = z.infer<
  typeof markFamilyThreadReadSchema
>;
export type CloseFamilyThreadInput = z.infer<typeof closeFamilyThreadSchema>;
export type UpdateFamilyNotificationPreferencesInput = z.infer<
  typeof updateFamilyNotificationPreferencesSchema
>;
export type PublishSchoolAnnouncementInput = z.infer<
  typeof publishSchoolAnnouncementSchema
>;
export type LearningEventV2Client = z.infer<typeof learningEventV2ClientSchema>;
