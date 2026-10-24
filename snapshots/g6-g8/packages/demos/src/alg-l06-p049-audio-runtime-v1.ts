import {FixedQuizPageRuntimeV1,type FixedQuizRuntimeBinding} from './source-fixed-feedback-runtime-v1';
import {P049_MEASURED_BINDINGS,P049_RIGHT4_ENTRY} from './alg-l06-p049-measured-bindings-v1';
import {initialP049State,reduceP049,P049_SOURCE} from './alg-l06-p049-state-v1';
import type {FixedQuizRuntimeOptions} from './source-fixed-feedback-runtime-v1';
export type {FixedQuizRuntimeOptions as P049RuntimeOptions,FixedQuizRuntimeSnapshot as P049RuntimeSnapshot} from './source-fixed-feedback-runtime-v1';
// Exact ADPCM block1 boundary mapped to the measured browser sample grid.
// Resampler phase, original-runtime alignment and listening remain unaccepted.
if(P049_RIGHT4_ENTRY.entryFrame!==P049_SOURCE.right.startFrame||
 P049_RIGHT4_ENTRY.decodedSample!==Math.ceil(P049_RIGHT4_ENTRY.skippedSourceSamples*P049_MEASURED_BINDINGS.right4.sampleRate/P049_RIGHT4_ENTRY.sourceRate))
 throw Error('P049_RIGHT4_ENTRY_SOURCE_BINDING');
export const P049_RUNTIME_BINDING:FixedQuizRuntimeBinding=Object.freeze({
 initialState:initialP049State,reduce:reduceP049,measured:P049_MEASURED_BINDINGS,
 firstAudioFrame:{main:12,wrong4:2,right4:1},decodedEntrySamples:{right4:P049_RIGHT4_ENTRY.decodedSample},
 quizFrame:P049_SOURCE.quizFrame,lastFrame:P049_SOURCE.mainFrames,
 wrongHoldFrame:P049_SOURCE.wrong.holdFrame,wrongTerminalFrame:P049_SOURCE.wrong.terminalFrame,
 rightTerminalFrame:P049_SOURCE.right.terminalFrame});
export class P049PageRuntimeV1 extends FixedQuizPageRuntimeV1 {
 constructor(options:FixedQuizRuntimeOptions){super(P049_RUNTIME_BINDING,options);}
}
