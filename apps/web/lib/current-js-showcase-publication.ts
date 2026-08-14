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
  const enabled = releaseId === G4_L3_SHOWCASE_RELEASE_ID &&
    env.CURRENT_JS_SHOWCASE_G4_L3_ENABLED === 'true';
  return Object.freeze({
    enabled,
    releaseId,
    scope: 'current-javascript-showcase' as const,
    strictReleaseExpanded: false as const,
  });
}
