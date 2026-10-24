import 'server-only';
import {g678RegisteredDescriptorsWithExtensions} from './g678-current-js-extensions.server';
import {algL12P009CurrentJsDescriptor} from './g678-alg-l12-p009-current-js-v2.server';

/** Preserve the frozen aggregate and independently admit one P009 successor. */
export function g678RegisteredDescriptorsWithP009() {
  const preceding = g678RegisteredDescriptorsWithExtensions();
  try {
    const extended = algL12P009CurrentJsDescriptor();
    const matches = preceding.filter(descriptor => descriptor.course.moduleCode === 'ALG001' &&
      descriptor.course.lesson === 12);
    if (matches.length !== 1 || matches[0]!.calibrationId !== 'g678-alg-l12-p006-current-js-v2' ||
      matches[0]!.productBridge.registeredAnimationCount !== 20 ||
      extended.productBridge.registeredAnimationCount !== 21) return preceding;
    return preceding.map(descriptor => descriptor === matches[0] ? extended : descriptor);
  } catch {
    // An absent or stale P009 proof retains the independently trusted preceding
    // descriptor. It never substitutes an engineering candidate or raises a count.
    return preceding;
  }
}
