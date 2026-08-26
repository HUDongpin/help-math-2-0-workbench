import {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
} from './g4-page-only-release-metadata.generated';
import {
  currentJsCandidateProfileEnabled,
  isCurrentJsProductionReleaseApproved,
} from './current-js-asset-profile';
import {
  isPublicLessonReleaseDeploymentRuntimeAssetAuthorized,
  isPublicLessonReleasePreviewRuntimeAssetAuthorized,
  isPublicLessonReleaseProductionRuntimeAssetAuthorized,
  publicLaunchDeploymentTarget,
} from './public-launch-manifest.server';

/**
 * Compatibility facade for a runnable current-JavaScript Lesson.
 *
 * Production authority comes only from the public launch manifest. Legacy
 * showcase environment variables remain available solely for non-production
 * local audit and cannot expand Preview, Released, or Production state.
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
export {
  G4_L5_PAGE_ONLY_RELEASE_ID,
  G4_L10_PAGE_ONLY_RELEASE_ID,
  G4_L11_PAGE_ONLY_RELEASE_ID,
};

const SHOWCASE_ENVIRONMENT_KEY_BY_RELEASE = Object.freeze({
  [G3_L2_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G3_L2_ENABLED',
  [G4_L3_SHOWCASE_RELEASE_ID]: 'CURRENT_JS_SHOWCASE_G4_L3_ENABLED',
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
  profile: 'candidate' | 'preview' | 'production' | 'unavailable';
  previewApproved: boolean;
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
  const optedIn = environmentKey !== undefined &&
    env[environmentKey] === 'true';
  const productionApproved =
    isPublicLessonReleaseProductionRuntimeAssetAuthorized(releaseId);
  const previewApproved =
    isPublicLessonReleasePreviewRuntimeAssetAuthorized(releaseId);
  const deploymentApproved =
    isPublicLessonReleaseDeploymentRuntimeAssetAuthorized(releaseId, env);
  const deploymentTarget = publicLaunchDeploymentTarget(env);
  const hasProductionAssetProfileEvidence =
    isCurrentJsProductionReleaseApproved(releaseId);
  const candidateEnabled = currentJsCandidateProfileEnabled(env);
  const localAuditEnabled = env.NODE_ENV !== 'production'
    && optedIn
    && (hasProductionAssetProfileEvidence || candidateEnabled);
  const enabled = deploymentApproved || localAuditEnabled;
  return Object.freeze({
    enabled,
    profile: enabled
      ? deploymentTarget === 'preview'
        ? 'preview' as const
        : deploymentTarget === 'production'
          ? 'production' as const
          : 'candidate' as const
      : 'unavailable' as const,
    previewApproved,
    productionApproved,
    releaseId,
    scope: 'current-javascript-showcase' as const,
    strictReleaseExpanded: false as const,
  });
}
