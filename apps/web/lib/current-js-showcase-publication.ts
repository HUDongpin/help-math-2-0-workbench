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
export const G3_L2_SHOWCASE_RELEASE_ID =
  'lesson-g03-l02-addition-subtraction-page-only-current-js';
export const G5_L3_SHOWCASE_RELEASE_ID =
  'lesson-g05-l03-exponents-prime-factorizations-page-only';
export const G5_L4_SHOWCASE_RELEASE_ID =
  'lesson-g05-l04-number-lines';
export const G5_L5_SHOWCASE_RELEASE_ID =
  'lesson-g05-l05-add-subtract-negative-numbers';

const SHOWCASE_ENVIRONMENT_KEY_BY_RELEASE = Object.freeze({
  [G3_L2_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED',
  [G4_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED',
  [G5_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L3_ENABLED',
  [G5_L4_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L4_ENABLED',
  [G5_L5_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G5_L5_ENABLED',
} as const);

export type CurrentJsShowcaseEnvironment =
  Readonly<Record<string, string | undefined>>;

export type CurrentJsShowcasePublication = Readonly<{
  enabled: boolean;
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
  const enabled = environmentKey !== undefined &&
    env[environmentKey] === 'true';
  return Object.freeze({
    enabled,
    releaseId,
    scope: 'current-javascript-showcase' as const,
    strictReleaseExpanded: false as const,
  });
}
