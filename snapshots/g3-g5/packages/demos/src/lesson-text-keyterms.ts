import type {LessonTextKeyTermsCapability} from './lesson-text-contract';
import type {LessonHostRequest} from './lesson-host-contract';

const INDEX_SOURCES = {
  en: {assetId:'ELKTEG4.xml',sha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749'},
  es: {assetId:'ELKTSG4.xml',sha256:'7f12ce833f1429073a11a3ea0dd9d9964eb773804c18c025bde12552b3be5a00'},
} as const;

/** This validates a bounded product adapter, never a general legacy URL call. */
export function validateLessonTextKeyTerms(capability: LessonTextKeyTermsCapability) {
  const source = INDEX_SOURCES[capability.indexLanguage];
  if (!source || capability.sourceAssetId !== source.assetId || capability.sourceSha256 !== source.sha256
    || !Array.isArray(capability.entryIds)
    || (!capability.entryIds.length && !capability.sourceKeyBindings?.length)
    || new Set(capability.entryIds).size !== capability.entryIds.length
    || capability.entryIds.some(id => !new RegExp(`^${capability.indexLanguage}-\\d{4}-[a-f0-9]{12}$`).test(id))) {
    throw new Error('Modern lesson key terms lack a supported exact source index');
  }
  if (capability.sourceKeyBindings !== undefined) {
    const bindings = capability.sourceKeyBindings;
    if (!Array.isArray(bindings) || !bindings.length
      || new Set(bindings.map(binding => JSON.stringify(binding))).size !== bindings.length
      || bindings.some(binding => !binding || !Number.isSafeInteger(binding.sourceButtonId) || binding.sourceButtonId < 1
        || typeof binding.sourceKey !== 'string' || !binding.sourceKey.trim() || binding.sourceKey.length > 200
        || /[\x00-\x1f\x7f]/.test(binding.sourceKey)
        || typeof binding.frameDomain !== 'string' || !binding.frameDomain.trim()
        || !Number.isSafeInteger(binding.startFrame) || binding.startFrame < 1
        || !Number.isSafeInteger(binding.endFrame) || binding.endFrame < binding.startFrame)) {
      throw new Error('Modern lesson source key terms lack authored button/frame bindings');
    }
  }
}

export function lessonTextKeyTermRequestAllowed(capability: LessonTextKeyTermsCapability | undefined,
  request: LessonHostRequest, animationId: string,
  currentFrameContext?: Readonly<{frame: number; frameDomain: string; capture?: boolean}>) {
  if (!capability) return false;
  if (request.type === 'close-keyterm') return true;
  if (request.type === 'open-keyterm-by-source-key') {
    try { validateLessonTextKeyTerms(capability); } catch { return false; }
    return request.sourceAnimationId === animationId
      && request.playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume'
      && Boolean(currentFrameContext && !currentFrameContext.capture
        && Number.isSafeInteger(request.frame) && request.frame === currentFrameContext.frame
        && request.frameDomain === currentFrameContext.frameDomain
        && capability.sourceKeyBindings?.some(binding => binding.sourceKey === request.sourceKey
          && binding.sourceButtonId === request.sourceButtonId && binding.frameDomain === request.frameDomain
          && request.frame >= binding.startFrame && request.frame <= binding.endFrame));
  }
  return request.type === 'open-keyterm' && request.sourceAnimationId === animationId
    && capability.entryIds.includes(request.entryId)
    && request.playbackDisposition === 'source-stop-timeline-and-audio-until-explicit-resume';
}
