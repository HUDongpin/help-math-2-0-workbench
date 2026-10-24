'use client';
/** Static drawing entry; maintained P035PlayerV1 owns real My Lesson interaction and audio. */
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P035_DRAWING} from '../timelines/shared-alg001-l06-p035';
import {P035_SOURCE} from '../alg-l06-p035-state-v1';
import {P035_MEASURED_BINDINGS} from '../alg-l06-p035-measured-bindings-v1';
const drawing=ALG_L06_P035_DRAWING;
if(drawing.sourceSwfSha256!==P035_SOURCE.swfSha256||drawing.mainFrameDomain!=='sprite-227'||
 drawing.mainFrameCount!==534||P035_SOURCE.quizFrame!==145||
 P035_MEASURED_BINDINGS.main.sourceSha256!=='31769b5944c74d1246f2fea66f4da200c2e57de869ab63ac4293ea0ae87d36c0'||
 P035_MEASURED_BINDINGS.sa.sourceSha256!==P035_SOURCE.separateSaSha256)
 throw Error('P035_DRAWING_SOURCE_IDENTITY');
const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P035:Object.freeze({drawing,mainSource:P035_MEASURED_BINDINGS.main,
 optionalAudio:P035_MEASURED_BINDINGS.sa,quizFrame:145,source179Enabled:false,
 owner:'maintained-P035PlayerV1',sourceGlyphsPreserved:true,
 optionalAudioTrigger:'explicit-user-only',mainSplice:false,
 originalRuntimeParity:false,audioAccepted:false})});
