import {z} from 'zod';

/** Maximum UTF-8 size accepted by the Nova route, including an optional frame. */
export const NOVA_MAX_REQUEST_BYTES = 32 * 1024;

export const NOVA_REQUEST_LIMITS = Object.freeze({
  messageCharacters: 1_200,
  historyMessages: 8,
  historyMessageCharacters: 800,
  historyTotalCharacters: 4_800,
  frameBytes: 18 * 1024,
  frameDataUrlCharacters: 25_000,
});

export const novaLocales = ['en', 'es'] as const;
export const novaModes = ['focus', 'study', 'classroom'] as const;
export const novaHistoryRoles = ['user', 'assistant'] as const;
export const novaInputMethods = ['typed', 'speech-to-draft'] as const;

const releaseIdSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const animationIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z0-9_-]+$/);

const novaHistoryMessageSchema = z
  .object({
    role: z.enum(novaHistoryRoles),
    text: z
      .string()
      .trim()
      .min(1)
      .max(NOVA_REQUEST_LIMITS.historyMessageCharacters),
  })
  .strict();

/**
 * Strict transport shape only. The server independently resolves every field
 * against the registered lesson descriptor before a provider may receive it.
 */
const novaLessonContextSchema = z
  .object({
    releaseId: releaseIdSchema,
    grade: z.number().int().min(1).max(12),
    lesson: z.number().int().min(1).max(100),
    animationId: animationIdSchema,
    sectionCode: z.string().min(1).max(24).regex(/^[A-Za-z0-9_-]+$/),
    sectionTitle: z.string().min(1).max(80),
    globalPageOrdinal: z.number().int().min(1).max(1_000),
    activePageCount: z.number().int().min(1).max(1_000),
    pageTitle: z.string().min(1).max(180),
    pageTitleEnglish: z.string().min(1).max(180),
    pageTitleSpanish: z.string().max(180).nullable(),
    locale: z.enum(novaLocales),
    pageTitleUsesEnglishFallback: z.boolean(),
    assessment: z.boolean(),
  })
  .strict();

const frameDataUrlSchema = z
  .string()
  .max(NOVA_REQUEST_LIMITS.frameDataUrlCharacters)
  .superRefine((value, context) => {
    const match = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) {
      context.addIssue({
        code: 'custom',
        message: 'The frame must be a base64 PNG or JPEG data URL.',
      });
      return;
    }

    let bytes: Uint8Array;
    try {
      const binary = atob(match[2]);
      bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      context.addIssue({code: 'custom', message: 'The frame is not valid base64.'});
      return;
    }

    if (bytes.byteLength === 0) {
      context.addIssue({code: 'custom', message: 'The frame is empty.'});
      return;
    }
    if (bytes.byteLength > NOVA_REQUEST_LIMITS.frameBytes) {
      context.addIssue({
        code: 'custom',
        message: 'The frame exceeds the frame-size limit.',
      });
      return;
    }

    const isPng =
      match[1] === 'image/png' &&
      bytes.byteLength >= 8 &&
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
        .every((byte, index) => bytes[index] === byte);
    const isJpeg =
      match[1] === 'image/jpeg' &&
      bytes.byteLength >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;

    if (!isPng && !isJpeg) {
      context.addIssue({
        code: 'custom',
        message: 'The declared frame type does not match its file signature.',
      });
    }
  });

const novaFrameSchema = z
  .object({
    releaseId: releaseIdSchema,
    globalPageOrdinal: z.number().int().min(1).max(1_000),
    animationId: animationIdSchema,
    dataUrl: frameDataUrlSchema,
    width: z.number().int().min(1).max(2_048),
    height: z.number().int().min(1).max(2_048),
  })
  .strict();

function mismatch(context: z.RefinementCtx, path: (string | number)[]) {
  context.addIssue({
    code: 'custom',
    path,
    message: 'The Nova Tutor request contains inconsistent lesson data.',
  });
}

/**
 * Closed client-to-server transport contract for Nova Tutor.
 *
 * It rejects unknown keys, malformed identifiers, cross-field inconsistencies,
 * oversized text, and malformed image envelopes. Course/page authorization
 * and canonical labels are intentionally resolved only in server-only code.
 */
export const novaTutorRequestSchema = z
  .object({
    locale: z.enum(novaLocales),
    mode: z.enum(novaModes).optional().default('focus'),
    // This optional, privacy-safe provenance marker exists only so the route
    // can distinguish confirmed speech-to-draft use in content-free logs.
    // It never authorizes speech, carries no audio, and is not sent upstream.
    inputMethod: z.enum(novaInputMethods).optional().default('typed'),
    message: z
      .string()
      .trim()
      .min(1)
      .max(NOVA_REQUEST_LIMITS.messageCharacters),
    history: z
      .array(novaHistoryMessageSchema)
      .max(NOVA_REQUEST_LIMITS.historyMessages)
      .optional()
      .default([]),
    context: novaLessonContextSchema,
    frame: novaFrameSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.locale !== request.context.locale) {
      mismatch(context, ['context', 'locale']);
    }

    const historyCharacters = request.history.reduce(
      (total, entry) => total + entry.text.length,
      0,
    );
    if (historyCharacters > NOVA_REQUEST_LIMITS.historyTotalCharacters) {
      context.addIssue({
        code: 'custom',
        path: ['history'],
        message: 'The conversation history exceeds the request limit.',
      });
    }

    if (!request.frame) return;
    for (const field of [
      'releaseId',
      'globalPageOrdinal',
      'animationId',
    ] as const) {
      if (request.frame[field] !== request.context[field]) {
        mismatch(context, ['frame', field]);
      }
    }
  });

/**
 * Distinguish bounded transport exhaustion from malformed or forged lesson
 * data. The route maps only these known size issues to HTTP 413.
 */
export function novaTransportValidationIsTooLarge(error: z.ZodError) {
  return error.issues.some((issue) => {
    if (issue.code === 'too_big') {
      if (issue.path[0] === 'message' && issue.path.length === 1) return true;
      if (issue.path[0] === 'history') {
        return issue.path.length === 1 || issue.path[2] === 'text';
      }
      return issue.path[0] === 'frame' && issue.path[1] === 'dataUrl';
    }
    return issue.code === 'custom' && (
      issue.message === 'The conversation history exceeds the request limit.' ||
      issue.message === 'The frame exceeds the frame-size limit.'
    );
  });
}

export type NovaTutorTransportRequest = z.infer<
  typeof novaTutorRequestSchema
>;

export type NovaTutorInputMethod =
  (typeof novaInputMethods)[number];
