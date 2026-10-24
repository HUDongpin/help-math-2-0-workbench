import {transitionDescriptorGlossaryPause as transitionBase,
  type DescriptorGlossaryPauseSession} from './descriptor-driven-glossary-pause';
import type {PrivateLessonRuntimeAdapter} from './lesson-runtime-adapter';
export {resetDescriptorGlossaryPause, type DescriptorGlossaryPauseSession} from './descriptor-driven-glossary-pause';

/** Only the selected, already-gated private adapter may opt into this policy. */
export function privateGlossaryClosePolicy(adapter: PrivateLessonRuntimeAdapter | undefined): 'stay-paused' | undefined {
  return adapter && 'glossaryClosePolicy' in adapter && adapter.glossaryClosePolicy === 'stay-paused'
    ? 'stay-paused' : undefined;
}

export function transitionDescriptorGlossaryPause<T>(input: {
  allowed: boolean; pageSessionId: string; paused: boolean;
  requestType: 'open-glossary' | 'close-glossary';
  seekRequest: T | null; session: DescriptorGlossaryPauseSession<T> | null;
  glossaryClosePolicy?: 'stay-paused';
}) {
  const next = transitionBase(input);
  if (input.allowed && input.requestType === 'close-glossary' &&
      input.glossaryClosePolicy === 'stay-paused' &&
      input.session?.pageSessionId === input.pageSessionId) return {...next, paused: true};
  return next;
}
