import {z} from 'zod';

import type {FamilyActionResult} from './types';

const identifier = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9._:-]+$/u);

export const learningAssignmentLocatorSchema = z.uuid();

export const learningAssignmentObjectSchema = z.object({
  animationId: identifier,
  contentReleaseId: z.string().trim().min(1).max(128),
  learningObjectVersionId: z.string().trim().min(1).max(160),
  pageOrdinal: z.number().int().min(1).max(1_000),
  placementId: identifier,
  skillId: z.string().trim().min(1).max(160).nullable(),
}).strict();

export const learningAssignmentLaunchDtoSchema = z.object({
  assignmentId: z.uuid(),
  lessonHref: z.string().regex(/^\/(?:es\/)?courses\/[3-5]\/\d{1,2}$/u),
  lessonReleaseId: z.string().trim().min(1).max(160),
  objects: z.array(learningAssignmentObjectSchema).min(1).max(1_000),
  totalPages: z.number().int().min(1).max(1_000),
}).strict().superRefine(({objects, totalPages}, context) => {
  if (objects.length !== totalPages) {
    context.addIssue({
      code: 'custom',
      message: 'The assignment launch must bind every page.',
      path: ['objects'],
    });
  }
  const placements = new Set<string>();
  const learningObjects = new Set<string>();
  for (const [index, object] of objects.entries()) {
    if (object.pageOrdinal !== index + 1) {
      context.addIssue({
        code: 'custom',
        message: 'Assignment objects must be in contiguous source order.',
        path: ['objects', index, 'pageOrdinal'],
      });
    }
    if (placements.has(object.placementId)) {
      context.addIssue({
        code: 'custom',
        message: 'Assignment placement IDs must be unique.',
        path: ['objects', index, 'placementId'],
      });
    }
    if (learningObjects.has(object.learningObjectVersionId)) {
      context.addIssue({
        code: 'custom',
        message: 'Assignment learning-object versions must be unique.',
        path: ['objects', index, 'learningObjectVersionId'],
      });
    }
    placements.add(object.placementId);
    learningObjects.add(object.learningObjectVersionId);
  }
});

export const learningEventV2ReceiptSchema = z.object({
  ignored: z.number().int().min(0).max(50),
  inserted: z.number().int().min(0).max(50),
}).strict().refine(({ignored, inserted}) => ignored + inserted <= 50, {
  message: 'Learning event receipt exceeds the request batch bound.',
});

export type LearningAssignmentLaunch = z.infer<
  typeof learningAssignmentLaunchDtoSchema
>;
export type LearningAssignmentObject = z.infer<
  typeof learningAssignmentObjectSchema
>;
export type LearningEventV2Receipt = z.infer<
  typeof learningEventV2ReceiptSchema
>;
export type RecordAssignmentLearningEventsV2Action = (
  input: unknown,
) => Promise<FamilyActionResult<LearningEventV2Receipt>>;

export type LearningAssignmentLaunchEnvelopeResult =
  | Readonly<{data: LearningAssignmentLaunch; ok: true}>
  | Readonly<{ok: false; reason: 'invalid' | 'tenant-mismatch'}>;

export type LearningEventV2ReceiptEnvelopeResult =
  | Readonly<{data: LearningEventV2Receipt; ok: true}>
  | Readonly<{ok: false; reason: 'invalid' | 'tenant-mismatch'}>;

function parseTenantBoundEnvelope<T>(
  value: unknown,
  currentTenantId: string,
  browserSchema: z.ZodType<T>,
): Readonly<{data: T; ok: true}>
  | Readonly<{ok: false; reason: 'invalid' | 'tenant-mismatch'}> {
  if (
    !value
    || typeof value !== 'object'
    || Array.isArray(value)
    || !Object.hasOwn(value, 'tenantId')
  ) return {ok: false, reason: 'invalid'};
  const {tenantId, ...browserValue} = value as Record<string, unknown>;
  const parsedTenantId = z.uuid().safeParse(tenantId);
  if (!parsedTenantId.success) return {ok: false, reason: 'invalid'};
  if (parsedTenantId.data !== currentTenantId) {
    return {ok: false, reason: 'tenant-mismatch'};
  }
  const parsed = browserSchema.safeParse(browserValue);
  return parsed.success
    ? {data: parsed.data, ok: true}
    : {ok: false, reason: 'invalid'};
}

export function parseLearningAssignmentLaunchEnvelope(
  value: unknown,
  currentTenantId: string,
): LearningAssignmentLaunchEnvelopeResult {
  return parseTenantBoundEnvelope(
    value,
    currentTenantId,
    learningAssignmentLaunchDtoSchema,
  );
}

export function parseLearningEventV2ReceiptEnvelope(
  value: unknown,
  currentTenantId: string,
): LearningEventV2ReceiptEnvelopeResult {
  return parseTenantBoundEnvelope(
    value,
    currentTenantId,
    learningEventV2ReceiptSchema,
  );
}

export interface LearningAssignmentCourseContract {
  href: string;
  pages: readonly Readonly<{
    animationId: string;
    globalPageOrdinal: number;
    placementId?: string;
  }>[];
  releaseId: string;
}

/**
 * Production Lesson-release bindings are deliberately empty today: the
 * canonical Lesson release ledger has no published release, and the only V2
 * product slice is the synthetic G4 L3 assignment flow. Adding an identifier
 * here is only one negative-drift control; it does not publish a Lesson or
 * replace the database, route, browser, privacy, Owner, or release evidence
 * required for a real binding.
 */
export const FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS:
readonly string[] = Object.freeze([]);

export function publishedReleasesMissingFamilyLearningEventsV2Binding(
  publishedReleaseIds: readonly string[],
): readonly string[] {
  const bound = new Set(
    FAMILY_LEARNING_EVENTS_V2_PRODUCTION_RELEASE_BINDINGS,
  );
  return Object.freeze(
    [...new Set(publishedReleaseIds)]
      .filter((releaseId) => !bound.has(releaseId))
      .sort(),
  );
}

/**
 * Cross-binds database telemetry configuration to an already-admitted course
 * descriptor without changing or granting authority to that descriptor.
 */
export function learningAssignmentLaunchMatchesCourse(
  launch: LearningAssignmentLaunch,
  course: LearningAssignmentCourseContract,
): boolean {
  return launch.lessonHref === course.href
    && launch.lessonReleaseId === course.releaseId
    && launch.totalPages === course.pages.length
    && launch.objects.every((object, index) => {
      const page = course.pages[index];
      return page !== undefined
        && object.pageOrdinal === page.globalPageOrdinal
        && object.placementId === (page.placementId ?? page.animationId)
        && object.animationId === page.animationId;
    });
}
