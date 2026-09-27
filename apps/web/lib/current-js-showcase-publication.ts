import {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
} from './g4-page-only-release-metadata.generated';
import {
  currentJsCandidateProfileEnabled,
  isCurrentJsCandidateReleaseAvailable,
  isCurrentJsProductionReleaseApproved,
} from './current-js-asset-profile';
import {
  controlledPreviewReleaseAvailable,
  isControlledCurrentJsPreview,
} from './controlled-current-js-preview';

/**
 * Explicit public-product authorization for a runnable current-JavaScript
 * lesson that has not passed the separate strict Flash-migration release gate.
 *
 * This gate is intentionally narrow and cannot mutate or reinterpret the
 * completion/lesson-release ledgers. An enabled lesson must continue to show
 * its candidate evidence boundary in the player.
 */

export const G4_L3_SHOWCASE_RELEASE_ID =
  'lesson-g04-l03-negative-numbers';
export const G4_L1_SHOWCASE_RELEASE_ID =
  'lesson-g04-l01-place-value-page-only';
export const G4_L2_SHOWCASE_RELEASE_ID =
  'lesson-g04-l02-fractions-decimals-page-only';
export const G4_L4_SHOWCASE_RELEASE_ID =
  'lesson-g04-l04-addition-subtraction-page-only';
export const G4_L6_SHOWCASE_RELEASE_ID =
  'lesson-g04-l06-division-page-only';
export const G4_L7_SHOWCASE_RELEASE_ID =
  'lesson-g04-l07-factoring-page-only';
export const G4_L8_SHOWCASE_RELEASE_ID =
  'lesson-g04-l08-mathematical-expressions-page-only';
export const G4_L9_SHOWCASE_RELEASE_ID =
  'lesson-g04-l09-equations-page-only';
export const G4_L12_SHOWCASE_RELEASE_ID =
  'lesson-g04-l12-geometry-page-only';
export const G5_L1_SHOWCASE_RELEASE_ID =
  'lesson-g05-l01-working-with-decimals-and-percents-page-only';
export const G5_L2_SHOWCASE_RELEASE_ID =
  'lesson-g05-l02-percents-page-only';
export const G5_L6_SHOWCASE_RELEASE_ID =
  'lesson-g05-l06-division-skills-page-only';
export const G5_L7_SHOWCASE_RELEASE_ID =
  'lesson-g05-l07-add-subtract-multiply-divide-decimals-page-only';
export const G5_L8_SHOWCASE_RELEASE_ID =
  'lesson-g05-l08-add-subtract-fractions-page-only';
export const G5_L13_SHOWCASE_RELEASE_ID =
  'lesson-g05-l13-geometry-page-only';
export const G3_L2_SHOWCASE_RELEASE_ID =
  'lesson-g03-l02-addition-subtraction-page-only-current-js';
export const G3_L1_SHOWCASE_RELEASE_ID =
  'lesson-g03-l01-place-value-page-only';
export const G3_L3_SHOWCASE_RELEASE_ID =
  'lesson-g03-l03-multiplication-page-only';
export const G3_L4_SHOWCASE_RELEASE_ID =
  'lesson-g03-l04-division-page-only';
export const G3_L5_SHOWCASE_RELEASE_ID =
  'lesson-g03-l05-fractions-page-only';
export const G3_L6_SHOWCASE_RELEASE_ID =
  'lesson-g03-l06-decimals-money-page-only';
export const G3_L8_SHOWCASE_RELEASE_ID =
  'lesson-g03-l08-measurement-page-only';
export const G3_L9_SHOWCASE_RELEASE_ID =
  'lesson-g03-l09-measurement-page-only';
export const G5_L3_SHOWCASE_RELEASE_ID =
  'lesson-g05-l03-exponents-prime-factorizations-page-only';
export const G5_L4_SHOWCASE_RELEASE_ID =
  'lesson-g05-l04-number-lines';
export const G5_L5_SHOWCASE_RELEASE_ID =
  'lesson-g05-l05-add-subtract-negative-numbers';
export {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
};

const SHOWCASE_ENVIRONMENT_KEY_BY_RELEASE = Object.freeze({
  [G3_L1_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L1_ENABLED',
  [G3_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L3_ENABLED',
  [G3_L4_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L4_ENABLED',
  [G3_L2_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED',
  [G3_L5_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L5_ENABLED',
  [G3_L6_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L6_ENABLED',
  [G3_L8_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L8_ENABLED',
  [G3_L9_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L9_ENABLED',
  [G4_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED',
  [G4_L1_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L1_ENABLED',
  [G4_L2_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L2_ENABLED',
  [G4_L4_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L4_ENABLED',
  [G4_L6_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L6_ENABLED',
  [G4_L7_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L7_ENABLED',
  [G4_L8_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L8_ENABLED',
  [G4_L9_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L9_ENABLED',
  [G4_L12_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L12_ENABLED',
  [G5_L1_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L1_ENABLED',
  [G5_L2_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L2_ENABLED',
  [G5_L6_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L6_ENABLED',
  [G5_L7_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L7_ENABLED',
  [G5_L8_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L8_ENABLED',
  [G5_L13_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L13_ENABLED',
  [G4_L5_PAGE_ONLY_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L5_ENABLED',
  [G4_L10_PAGE_ONLY_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L10_ENABLED',
  [G4_L11_PAGE_ONLY_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L11_ENABLED',
  [G5_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED',
  [G5_L4_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L4_ENABLED',
  [G5_L5_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED',
} as const);

export type CurrentJsShowcaseEnvironment =
  Readonly<Record<string, string | undefined>>;

export type CurrentJsShowcasePublication = Readonly<{
  enabled: boolean;
  profile: 'candidate' | 'production' | 'unavailable';
  productionApproved: boolean;
  releaseId: string;
  scope: 'current-javascript-showcase';
  strictReleaseExpanded: false;
}>;

export function currentJsShowcasePublication(
  releaseId: string,
  env: CurrentJsShowcaseEnvironment = process.env,
): CurrentJsShowcasePublication {
  const environmentKey = SHOWCASE_ENVIRONMENT_KEY_BY_RELEASE[
    releaseId as keyof typeof SHOWCASE_ENVIRONMENT_KEY_BY_RELEASE
  ];
  const controlledPreview = isControlledCurrentJsPreview(env)
    && controlledPreviewReleaseAvailable(releaseId);
  const optedIn = environmentKey !== undefined &&
    (env[environmentKey] === 'true' || controlledPreview);
  const productionApproved =
    isCurrentJsProductionReleaseApproved(releaseId);
  const candidateEnabled = currentJsCandidateProfileEnabled(env) &&
    isCurrentJsCandidateReleaseAvailable(releaseId);
  const enabled = optedIn && (productionApproved || candidateEnabled);
  return Object.freeze({
    enabled,
    profile: enabled
      ? candidateEnabled ? 'candidate' as const : 'production' as const
      : 'unavailable' as const,
    productionApproved,
    releaseId,
    scope: 'current-javascript-showcase' as const,
    strictReleaseExpanded: false as const,
  });
}
