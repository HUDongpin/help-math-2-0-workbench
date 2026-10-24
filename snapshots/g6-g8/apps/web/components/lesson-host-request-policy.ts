import type {AnimationModule} from '../../../packages/demos/src/contract';
import type {LessonHostCapability, LessonHostRequest} from '../../../packages/demos/src/lesson-host-contract';

function lessonHostCapabilityForRequest(
  request: LessonHostRequest,
): LessonHostCapability | null {
  if (request.type === 'navigate') return 'navigation';
  if (request.type === 'set-language') return 'language';
  if (request.type === 'open-glossary' || request.type === 'close-glossary') {
    return 'glossary';
  }
  if (request.type === 'open-keyterm' || request.type === 'close-keyterm') {
    return 'keyterm';
  }
  if (request.type === 'open-calculator' || request.type === 'close-calculator') {
    return 'calculator';
  }
  if (request.type === 'play-audio' || request.type === 'stop-audio') {
    return 'audio';
  }
  if (request.type === 'record-fq-score' || request.type === 'reset-fq-score') {
    return 'fq-scoring';
  }
  if (
    request.type === 'record-practice-feedback' ||
    request.type === 'reset-practice-feedback'
  ) {
    return 'practice-feedback';
  }
  return null;
}

export function moduleDeclaresLessonHostRequest(
  module: AnimationModule | undefined,
  request: LessonHostRequest,
): boolean {
  const capability = lessonHostCapabilityForRequest(request);
  return capability !== null &&
    Boolean(module?.lessonHost?.capabilities.includes(capability));
}

