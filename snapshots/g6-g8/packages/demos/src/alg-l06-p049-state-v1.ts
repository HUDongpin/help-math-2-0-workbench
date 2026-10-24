import bindings from '../../../migrations/shared-alg001-l06-p049/native-v1/native-bindings-v3.json';
import {createFixedFeedbackQuiz} from './source-fixed-feedback-quiz-v1';
export type {FixedQuizChoice as P049Choice,FixedQuizState as P049State,FixedQuizEvent as P049Event,
 FixedQuizTransition as P049Transition,FixedQuizFeedback as P049Feedback} from './source-fixed-feedback-quiz-v1';
const core=createFixedFeedbackQuiz(bindings);
export const initialP049State=core.initialState;
export const reduceP049=core.reduce;
export const P049_CHOICES=bindings.options;
export const P049_SOURCE=Object.freeze({animationId:bindings.animationId,swfSha256:bindings.sourceSha256,
 ...bindings.runtime,wrong:bindings.behavior.wrong4,right:bindings.behavior.right4});
