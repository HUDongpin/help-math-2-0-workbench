import 'server-only';
import {g678RegisteredDescriptorsWithP009} from './g678-current-js-p009-successor-v2.server';
import {algL12P010CurrentJsDescriptor} from './g678-alg-l12-p010-current-js-v1.server';

/** Preserve the frozen aggregate and independently admit one P010 successor. */
export function g678RegisteredDescriptorsWithP010() {
  const preceding = g678RegisteredDescriptorsWithP009();
  try {
    const extended = algL12P010CurrentJsDescriptor();
    const matches = preceding.filter(descriptor => descriptor.course.moduleCode === 'ALG001' &&
      descriptor.course.lesson === 12);
    if (matches.length !== 1 || matches[0]!.calibrationId !== 'g678-alg-l12-p009-current-js-v2' ||
      matches[0]!.productBridge.registeredAnimationCount !== 21 ||
      extended.productBridge.registeredAnimationCount !== 22) return preceding;
    return preceding.map(descriptor => descriptor === matches[0] ? extended : descriptor);
  } catch {
    // An absent or stale P010 proof retains the independently trusted preceding
    // descriptor. It never substitutes an engineering candidate or raises a count.
    return preceding;
  }
}
