import {z} from 'zod';

import {
  G4_L3_LESSON,
  findG4L3Page,
} from './g4-l3-lesson-navigation';

export const LEARNING_EVENT_SCHEMA_VERSION = 1 as const;
export const LEARNING_EVENT_BATCH_SCHEMA_VERSION = 1 as const;
export const MAX_LEARNING_EVENT_BATCH_SIZE = 20;
export const MAX_LEARNING_EVENT_REQUEST_BYTES = 32 * 1024;

export const HELP_MATH_LEARNING_EVENT_TYPES = [
  'lesson.initialized',
  'lesson.resumed',
  'lesson.exited',
  'lesson.completed',
  'page.viewed',
  'page.completed',
  'support.used',
  'practice.evaluated',
] as const;

const PAGE_SCOPED_EVENT_TYPES = new Set<(typeof HELP_MATH_LEARNING_EVENT_TYPES)[number]>([
  'page.viewed',
  'page.completed',
  'support.used',
  'practice.evaluated',
]);

const animationIds = new Set(
  G4_L3_LESSON.pages.map((page) => page.animationId),
);

const animationIdSchema = z.string().superRefine((value, context) => {
  if (!animationIds.has(value)) {
    context.addIssue({
      code: 'custom',
      message: 'The animation is not an active Grade 4 Lesson 3 page.',
    });
  }
});

const pageSchema = z.object({
  animationId: animationIdSchema,
}).strict();

const progressSchema = z.object({
  completedPages: z.number().int().min(0).max(G4_L3_LESSON.activePageCount),
  percent: z.number().min(0).max(100),
}).strict();

const supportSchema = z.object({
  kind: z.enum([
    'nova-tutor',
    'read-aloud',
    'translation',
    'calculator',
    'help',
    'key-terms',
    'readable-view',
    'lesson-map',
  ]),
  action: z.enum(['opened', 'closed', 'used']),
}).strict();

const evaluationSchema = z.object({
  outcome: z.enum(['correct', 'incorrect', 'skipped', 'not-scored']),
  attempt: z.number().int().min(1).max(100),
}).strict();

export const learningEventSchema = z.object({
  schemaVersion: z.literal(LEARNING_EVENT_SCHEMA_VERSION),
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  sequence: z.number().int().min(0).max(1_000_000),
  occurredAt: z.string().datetime({offset: true}),
  type: z.enum(HELP_MATH_LEARNING_EVENT_TYPES),
  releaseId: z.literal(G4_L3_LESSON.releaseId),
  locale: z.enum(['en', 'es']),
  presentation: z.enum(['legacy-composite', 'modern-wide']),
  mode: z.enum(['focus', 'study', 'classroom']),
  page: pageSchema.optional(),
  progress: progressSchema.optional(),
  support: supportSchema.optional(),
  evaluation: evaluationSchema.optional(),
}).strict().superRefine((event, context) => {
  if (PAGE_SCOPED_EVENT_TYPES.has(event.type) && !event.page) {
    context.addIssue({
      code: 'custom',
      path: ['page'],
      message: `${event.type} requires an allowlisted lesson page.`,
    });
  }

  if (event.type === 'support.used' && !event.support) {
    context.addIssue({
      code: 'custom',
      path: ['support'],
      message: 'support.used requires a closed support descriptor.',
    });
  } else if (event.type !== 'support.used' && event.support) {
    context.addIssue({
      code: 'custom',
      path: ['support'],
      message: 'Support data is only allowed on support.used events.',
    });
  }

  if (event.type === 'practice.evaluated' && !event.evaluation) {
    context.addIssue({
      code: 'custom',
      path: ['evaluation'],
      message: 'practice.evaluated requires a closed evaluation outcome.',
    });
  } else if (event.type !== 'practice.evaluated' && event.evaluation) {
    context.addIssue({
      code: 'custom',
      path: ['evaluation'],
      message: 'Evaluation data is only allowed on practice.evaluated events.',
    });
  }

  if (event.page && !findG4L3Page(event.page.animationId)) {
    context.addIssue({
      code: 'custom',
      path: ['page', 'animationId'],
      message: 'The page is not in the active lesson navigation contract.',
    });
  }
});

export const learningEventBatchSchema = z.object({
  schemaVersion: z.literal(LEARNING_EVENT_BATCH_SCHEMA_VERSION),
  events: z.array(learningEventSchema).min(1).max(MAX_LEARNING_EVENT_BATCH_SIZE),
}).strict().superRefine((batch, context) => {
  const seen = new Set<string>();
  for (const [index, event] of batch.events.entries()) {
    if (seen.has(event.eventId)) {
      context.addIssue({
        code: 'custom',
        path: ['events', index, 'eventId'],
        message: 'A batch cannot contain the same eventId more than once.',
      });
    }
    seen.add(event.eventId);
  }
});

export type HelpMathLearningEvent = z.infer<typeof learningEventSchema>;
export type HelpMathLearningEventBatch = z.infer<typeof learningEventBatchSchema>;

const PROHIBITED_FIELD_FRAGMENTS = [
  'actor',
  'address',
  'answer',
  'audio',
  'birth',
  'diagnosis',
  'disability',
  'email',
  'ellabel',
  'elstatus',
  'englishlanguagelearner',
  'englishlearner',
  'firstname',
  'iep',
  'image',
  'lastname',
  'mbox',
  'message',
  'name',
  'phone',
  'photo',
  'prompt',
  'question',
  'questiontext',
  'response',
  'studentid',
  'transcript',
  'userid',
  'username',
  'voice',
] as const;

function normalizedFieldName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Finds prohibited client-supplied identity, free-text, media, or sensitive
 * learner fields before schema parsing. The server creates the xAPI actor;
 * callers cannot submit one. Values are deliberately never inspected or
 * echoed, so rejected payloads cannot leak their content into diagnostics.
 */
export function findProhibitedLearningEventField(
  value: unknown,
  path: readonly (string | number)[] = [],
): readonly (string | number)[] | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findProhibitedLearningEventField(item, [...path, index]);
      if (found) return found;
    }
    return null;
  }

  if (value === null || typeof value !== 'object') return null;

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const normalized = normalizedFieldName(key);
    if (PROHIBITED_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      return [...path, key];
    }
    const found = findProhibitedLearningEventField(child, [...path, key]);
    if (found) return found;
  }

  return null;
}
