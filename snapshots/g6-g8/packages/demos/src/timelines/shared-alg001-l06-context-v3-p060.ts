import type {RuntimeContext} from '../contract';
import {p060Initial, type P060State} from '../alg-l06-p060-state-v1';

export const P060_TIMELINE = Object.freeze({
  animationId: 'shared-alg001-l06-p060', title: 'Understanding Functions: Final Quiz',
  sourceSwfSha256: '3228fd031f09bc4f888e35328c4c3ffc1b7a85d430e62af77335fadcd3214832',
  sourceBytes: 48994, rootFrameCount: 10, rootBeginFrame: 6, fps: 12,
  mainFrameDomain: 'sprite-973', mainFrameCount: 69, questionCount: 24, sessionQuestionCount: 10,
  stage: Object.freeze({width:800,height:600}),
  transitionAuthority: 'source-release-actions-and-maintained-quiz-session',
});
/** Time alone cannot answer an interactive question. The generic host obtains
 * the initial session; the maintained reducer owns all later source-frame reads.
 * Raw source frames are preserved separately in the extraction evidence. */
export type P060InitialFrameState = P060State & {
  readonly frameDomain: 'sprite-973';
  readonly scenario: 'source-quiz';
  readonly language: 'en';
};

export function getP060InitialFrameState(frame: number, context: RuntimeContext): P060InitialFrameState {
  const domain = context.frameDomain ?? P060_TIMELINE.mainFrameDomain;
  if (!['root','sprite-973'].includes(domain) || !Number.isInteger(frame) || frame < 1 || frame > (domain==='root'?10:69)) throw Error('P060_FRAME_DOMAIN');
  // Report the implemented source quiz, not the caller's requested identity.
  // The host rejects unsupported root/scenario/language queries by comparison.
  return {...p060Initial(context.seed, context.replay ?? 0), frameDomain: 'sprite-973', scenario: 'source-quiz', language: 'en'};
}
