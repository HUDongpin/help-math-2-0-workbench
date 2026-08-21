import {z} from 'zod';
import {
  findG4L3Page,
  findG4L3Section,
  G4_L3_LESSON,
  getG4L3PageLabel,
  getG4L3SectionLabel,
  type G4L3SectionCode,
} from './g4-l3-lesson-navigation';

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

const g4L3SectionCodes = ['IR', 'RW', 'VB', 'IN', 'TI', 'GS', 'TS', 'FQ'] as const;

const novaHistoryMessageSchema = z
  .object({
    role: z.enum(novaHistoryRoles),
    text: z.string().trim().min(1).max(NOVA_REQUEST_LIMITS.historyMessageCharacters),
  })
  .strict();

const novaLessonContextSchema = z
  .object({
    releaseId: z.literal('lesson-g04-l03-negative-numbers'),
    grade: z.literal(4),
    lesson: z.literal(3),
    animationId: z.string().min(1).max(80),
    sectionCode: z.enum(g4L3SectionCodes),
    sectionTitle: z.string().min(1).max(80),
    globalPageOrdinal: z.number().int().min(1).max(G4_L3_LESSON.activePageCount),
    activePageCount: z.literal(39),
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

    if (bytes.byteLength === 0 || bytes.byteLength > NOVA_REQUEST_LIMITS.frameBytes) {
      context.addIssue({
        code: 'custom',
        message: 'The frame is empty or exceeds the frame-size limit.',
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
    animationId: z.string().min(1).max(80),
    dataUrl: frameDataUrlSchema,
    width: z.number().int().min(1).max(2_048),
    height: z.number().int().min(1).max(2_048),
  })
  .strict();

function assessmentSection(sectionCode: G4L3SectionCode) {
  return sectionCode === 'TI' || sectionCode === 'TS' || sectionCode === 'FQ';
}

function mismatch(context: z.RefinementCtx, path: (string | number)[]) {
  context.addIssue({
    code: 'custom',
    path,
    message: 'The lesson context does not match the canonical Grade 4 Lesson 3 page.',
  });
}

/**
 * Closed client-to-server contract for Nova Tutor.
 *
 * Every lesson label and ordinal is cross-checked against the canonical G4 L3
 * navigation table. This prevents caller-supplied page metadata from becoming
 * an untrusted second system prompt.
 */
export const novaTutorRequestSchema = z
  .object({
    locale: z.enum(novaLocales),
    mode: z.enum(novaModes).optional().default('focus'),
    message: z.string().trim().min(1).max(NOVA_REQUEST_LIMITS.messageCharacters),
    history: z.array(novaHistoryMessageSchema).max(NOVA_REQUEST_LIMITS.historyMessages).optional().default([]),
    context: novaLessonContextSchema,
    frame: novaFrameSchema.optional(),
  })
  .strict()
  .superRefine((request, context) => {
    if (request.locale !== request.context.locale) mismatch(context, ['context', 'locale']);

    const page = findG4L3Page(request.context.animationId);
    if (!page) {
      mismatch(context, ['context', 'animationId']);
      return;
    }

    const section = findG4L3Section(page.sectionCode);
    const pageLabel = getG4L3PageLabel(page, request.locale);
    const sectionLabel = getG4L3SectionLabel(section, request.locale);
    const expected = {
      sectionCode: page.sectionCode,
      sectionTitle: sectionLabel.text,
      globalPageOrdinal: page.globalPageOrdinal,
      pageTitle: pageLabel.text,
      pageTitleEnglish: page.titleEnglish,
      pageTitleSpanish: page.titleSpanish,
      pageTitleUsesEnglishFallback: pageLabel.usesEnglishFallback,
      assessment: assessmentSection(page.sectionCode),
    } as const;

    for (const [field, expectedValue] of Object.entries(expected)) {
      const actualValue = request.context[field as keyof typeof expected];
      if (actualValue !== expectedValue) mismatch(context, ['context', field]);
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

    if (request.frame?.animationId !== undefined && request.frame.animationId !== page.animationId) {
      mismatch(context, ['frame', 'animationId']);
    }
  });

export type NovaTutorRequest = z.infer<typeof novaTutorRequestSchema>;
