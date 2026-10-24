import {
  localOnlyAnimationModuleRegistration,
  registeredLocalOnlyAnimationKeys,
} from '@helpmath/demos/local-only-animation-registry-metadata';

export const G678_FROZEN16_CONTINUOUS_FREEZE = Object.freeze({
  path: 'catalog/product-bridge-calibrations/g678-current-js-379-page-registration-v26.json',
  bytes: 2650947,
  sha256: '21bde88b4beabe7ce6ea4f01c61e5c1a98b1d60dd8c5d6e0be9db48d569cf825',
});

const CALIBRATION_ID = 'g678-16-page-product-calibration-v1';
const ANIMATION_ID = /^shared-(nms002|geo001|alg001|dat001)-l\d{2}-p\d{3}$/u;
const QA_PHASE = 'frozen16-continuous-audio-provisional-browser-qa';

type Registration = Readonly<{
  calibrationId?: string;
  freezeManifestSha256?: string;
}>;

export function exactFrozen16RegistryScope(registrations: readonly Registration[]) {
  return registrations.length === 379 && registrations.every((registration) =>
    registration.calibrationId === CALIBRATION_ID &&
    registration.freezeManifestSha256 === G678_FROZEN16_CONTINUOUS_FREEZE.sha256);
}

export function currentFrozen16LocalAuthorityScope() {
  const phase = process.env.HELP_MATH_G678_CALIBRATION_PHASE;
  if (phase === QA_PHASE) return true;
  if (phase !== undefined || process.env.NODE_ENV === 'production') return false;
  const registrations = registeredLocalOnlyAnimationKeys
    .filter((animationId) => ANIMATION_ID.test(animationId))
    .map((animationId) => localOnlyAnimationModuleRegistration(animationId))
    .filter((registration) => registration?.calibrationId === CALIBRATION_ID);
  return exactFrozen16RegistryScope(registrations);
}
