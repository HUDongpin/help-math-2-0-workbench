import {P057_BEHAVIOR_SOURCE} from './generated/alg-l06-p057-behavior-v1';
import {createFunctionWalkthroughReducer} from './g678-advanced-manual/source-function-walkthrough-state-v1';
export {P057_BEHAVIOR_SOURCE};
export type {WalkthroughState as P057State,WalkthroughChoice as P057Choice,WalkthroughEvent as P057Event,WalkthroughTransition as P057Transition} from './g678-advanced-manual/source-function-walkthrough-state-v1';
export const {initialState:p057InitialState,reduce:p057Reduce}=createFunctionWalkthroughReducer(P057_BEHAVIOR_SOURCE);
