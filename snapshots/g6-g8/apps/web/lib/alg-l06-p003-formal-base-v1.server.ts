import 'server-only';
import {algL6PredecessorV2} from './alg-l06-predecessor-v2.server';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Compatibility entry for the P003 formal projection. The maintained
 * predecessor reader verifies the source-ordered historical 17, the P001/P002
 * freezes, current registry and every separately indexed later page proof.
 * This shim returns only the 19-page base expected by the frozen P003 extender;
 * it does not project P003 or admit P004 itself. */
export function algL6P003FormalBaseDescriptor():PageOnlyLessonPlayerDescriptor{
 const result=algL6PredecessorV2();
 if(!result.admittedPageProofs.some(page=>page.animationId==='shared-alg001-l06-p003'))
  throw Error('P003_FORMAL_BASE: independently verified P003 proof required');
 return result.base;
}
