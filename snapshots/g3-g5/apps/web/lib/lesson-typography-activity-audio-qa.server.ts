/** Local candidate QA admits only declared modern activity assets. This does
 * not enable the course's ordinary narration or change publication gates. */
export function isLocalLessonTypographyActivityAudioQa(
  host: string | null | undefined,
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  const controlledLocalProduction = env.NODE_ENV === 'production'
    && env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW === 'current-js-1751-controlled-preview-v1'
    && env.HELP_MATH_CONTROLLED_CURRENT_JS_PREVIEW_LOCAL === 'current-js-1751-controlled-preview-v1';
  if (env.VERCEL_ENV !== undefined ||
    (env.NODE_ENV !== 'development' && !controlledLocalProduction) ||
    env.NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY !== 'candidate-v1' ||
    env.HELP_MATH_CURRENT_JS_CANDIDATE_QA !== 'current-js-candidate-profile-v1') return false;
  if (typeof host !== 'string') return false;
  const match = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::([0-9]{1,5}))?$/i.exec(host);
  return Boolean(match && (match[1] === undefined || (Number(match[1]) >= 1 && Number(match[1]) <= 65535)));
}
