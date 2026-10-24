/** Registry drawing module only. P034PlayerV1 owns native text, graph drag and one audio owner in My Lesson. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P034_DRAWING} from '../timelines/shared-alg001-l06-p034';
import {P034_SOURCE} from '../alg-l06-p034-audio-clock-v1';
import {P034_SA_ASSET} from '../alg-l06-p034-optional-spanish-audio-v1';

const drawing=ALG_L06_P034_DRAWING;
if(drawing.sourceSwfSha256!==P034_SOURCE.swfSha256||
 drawing.mainFrameDomain!=='sprite-40'||drawing.mainFrameCount!==434||
 drawing.livePlaybackEndFrame!==433||drawing.rootFrameCount!==13||
 drawing.rootBeginFrame!==6||drawing.fps!==12||
 P034_SOURCE.mainSha256!=='9f75303ceb0bd281d47f92583f1c40aa34b4974695a0c019199682b507131e2d'||
 P034_SOURCE.mainPcmSha256!=='337c5ff5833df48a5234844c1e1ada31a72514229d6524c47eec3f0bbba59e3b'||
 P034_SA_ASSET.sourceSha256!==P034_SOURCE.spanishSha256||
 P034_SA_ASSET.decodedSamples!==1504512||P034_SA_ASSET.sampleRate!==48000)
 throw Error('P034_DRAWING_CLOCK_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
 privateAlgL06P034:Object.freeze({version:1 as const,drawing,
  sourceMain:Object.freeze({sha256:P034_SOURCE.mainSha256,decodedSamples:741312,
   sampleRate:22050,sourceStopFrame:433 as const,finalEncodedFrame:434 as const,
   nativeEofRequired:true as const}),
  optionalSpanishAudio:P034_SA_ASSET,
  interactionOwner:'maintained-P034PlayerV1-graph-drag-native-clock' as const,
  canvasSourceGlyphsPreserved:true,graphLabelsNativeCompanion:false,
  optionalSpanishTrigger:'explicit-user-only' as const,
  mainStreamSpliced:false,originalRuntimeParity:false,audioAccepted:false})});
