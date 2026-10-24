/** Candidate presentation switch; source evidence and publication stay separate.
 * A module must additionally declare a source-bound presentation capability.
 */
export function isLessonTypographyCandidateEnabled() {
  return process.env.NEXT_PUBLIC_HELP_MATH_LESSON_TYPOGRAPHY === 'candidate-v1';
}

/** A fully English source binding may be shown from an ES product entry.
 * The source language remains EN; this never creates an ES translation or
 * changes the independently selected narration language. */
export function lessonTypographyLanguages(
  requested: string | undefined,
  uiLanguage: 'en' | 'es' | undefined,
  binding: {readonly blocks: readonly {readonly language: 'en' | 'es'}[]} | undefined,
): Readonly<{requestedLanguage: 'en' | 'es'; visualLanguage: 'en' | 'es'; uiLanguage: 'en' | 'es'; usesEnglishFallback: boolean}> {
  const requestedLanguage = requested === 'es' ? 'es' : 'en';
  const sourceOnlyEnglish = Boolean(binding?.blocks.length && binding.blocks.every(block => block.language === 'en'));
  const visualLanguage = sourceOnlyEnglish ? 'en' : requestedLanguage;
  return {requestedLanguage, visualLanguage,
    uiLanguage: uiLanguage ?? requestedLanguage,
    usesEnglishFallback: (uiLanguage ?? requestedLanguage) === 'es' && visualLanguage === 'en' && sourceOnlyEnglish};
}
