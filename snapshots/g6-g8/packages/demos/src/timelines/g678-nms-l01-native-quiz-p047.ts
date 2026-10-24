import {createP047Quiz} from '../nms-l01-p047-quiz-v1';
import type {RuntimeContext} from '../contract';

export const P047_TIMELINE = Object.freeze({animationId: 'shared-nms002-l01-p047',
  source: Object.freeze({path: 'G6-G8-shared/NMS002/L1/FQ/L1FQ02.swf', bytes: 78002,
    sha256: '748d7393d44dcfe9110ff429d0d8adcd6ec872bbf28a4ab6d2c4a4237f394647'}),
  rootFrameCount: 10, rootBeginFrame: 6, fps: 12, mainFrameDomain: 'sprite-1024', mainFrameCount: 74,
  questionCount: 27, sessionQuestionCount: 10, transitionAuthority: 'source-release-action-plus-maintained-quiz-reducer'});

/** This interactive movie holds for input. Only the declared initial state can
 * be obtained from time alone; responses are applied by reduceP047Quiz. Source
 * structural frame inspection uses the separate evidence renderer. */
export function getP047InitialFrameState(frame: number, context: RuntimeContext) {
  const domain = context.frameDomain === 'root' ? 'root' : 'sprite-1024';
  if (!Number.isInteger(frame) || frame < 1 || frame > (domain === 'root' ? 10 : 74)) throw Error('P047 frame outside source domain');
  return {...createP047Quiz(context.seed, context.replay ?? 0), frameDomain: domain, scenario: context.scenario, language: context.lang};
}
