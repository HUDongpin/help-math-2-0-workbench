/**
 * Local-only gate for HFR shared-lesson previews. It opens only on a local
 * development server with HFR_LESSON_PREVIEW_ENABLED=true; a production build
 * or any Vercel environment keeps it closed regardless of the flag.
 */
export function isHfrLessonPreviewEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.HFR_LESSON_PREVIEW_ENABLED === 'true' &&
    env.NODE_ENV !== 'production' &&
    env.VERCEL_ENV === undefined;
}

export const HFR_SHARED_MODULE_SLUGS = Object.freeze(['nms002', 'geo001', 'alg001', 'dat001'] as const);

/** `/courses/shared/<module>/<lesson>` without a locale prefix. */
export const HFR_SHARED_COURSE_PATH = /^\/courses\/shared\/(nms002|geo001|alg001|dat001)\/\d{1,2}$/u;
