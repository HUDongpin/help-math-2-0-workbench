import {G4_L3_LESSON} from './g4-l3-lesson-navigation';
import {isExecutivePreviewEnabled} from './executive-preview-access';

export const G4_L3_CONTROLLED_CEO_PREVIEW_COPY =
  'Controlled CEO Preview — current JavaScript candidate. Original-runtime full-frame comparison, human audio/visual review, Owner acceptance, strict completion, and public release are pending.';

export const G4_L3_CONTROLLED_CEO_PREVIEW_BOUNDARY = Object.freeze({
  previewId: 'g4-l3',
  releaseId: G4_L3_LESSON.releaseId,
  activePages: 39,
  courseShells: 1,
  releaseMembers: 40,
  strictCompleteMembers: 0,
  originalRuntimeFullFrameComparison: 'pending',
  humanAudioVisualReview: 'pending',
  ownerAcceptance: 'pending',
  strictCompletion: false,
  publicRelease: false,
} as const);

const previewMemberIds = new Set([
  ...G4_L3_LESSON.pages.map((page) => page.animationId),
  G4_L3_LESSON.shellAnimationId,
]);

export function isG4L3ControlledCeoPreviewEnabled() {
  return isExecutivePreviewEnabled();
}

export function isG4L3ControlledCeoPreviewMember(animationId: string) {
  return previewMemberIds.has(animationId);
}

export function isG4L3ControlledCeoPreviewHost(hostname: string) {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '[::1]';
}

export function isG4L3ControlledCeoPreviewHostHeader(host: string | null) {
  if (!host) return false;
  try {
    return isG4L3ControlledCeoPreviewHost(new URL(`http://${host}`).hostname);
  } catch {
    return false;
  }
}
