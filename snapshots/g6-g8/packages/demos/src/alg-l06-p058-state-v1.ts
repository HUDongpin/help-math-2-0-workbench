import {P058_BEHAVIOR_SOURCE} from './generated/alg-l06-p058-behavior-v1';
import {createFunctionWalkthroughReducer} from './g678-advanced-manual/source-function-walkthrough-state-v1';
export {P058_BEHAVIOR_SOURCE};
export type {WalkthroughState as P058State,WalkthroughChoice as P058Choice,WalkthroughEvent as P058Event,WalkthroughTransition as P058Transition} from './g678-advanced-manual/source-function-walkthrough-state-v1';
export const {initialState:p058InitialState,reduce:p058Reduce}=createFunctionWalkthroughReducer(P058_BEHAVIOR_SOURCE);
