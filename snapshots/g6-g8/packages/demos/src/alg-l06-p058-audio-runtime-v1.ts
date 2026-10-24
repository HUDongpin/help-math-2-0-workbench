import {createFunctionWalkthroughRuntime} from './g678-advanced-manual/source-function-walkthrough-runtime-v1';
import {P058_BEHAVIOR_SOURCE} from './generated/alg-l06-p058-behavior-v1';
import {P058_AUDIO_CLOCKS,P058_MEASURED_BINDINGS} from './alg-l06-p058-measured-bindings-v1';
export type {WalkthroughRuntimeSnapshot as P058RuntimeSnapshot,WalkthroughRuntimeOptions as P058RuntimeOptions,WalkthroughTransport as P058Transport} from './g678-advanced-manual/source-function-walkthrough-runtime-v1';
export const P058PageRuntimeV1=createFunctionWalkthroughRuntime({behavior:P058_BEHAVIOR_SOURCE,clocks:P058_AUDIO_CLOCKS,measured:P058_MEASURED_BINDINGS});
export type P058PageRuntimeV1=InstanceType<typeof P058PageRuntimeV1>;
