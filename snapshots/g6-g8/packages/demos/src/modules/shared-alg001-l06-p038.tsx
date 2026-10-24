/** P038 registry drawing module. P038PlayerV1 owns the source buttons and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P038_DRAWING} from '../timelines/shared-alg001-l06-p038';
import {P038_MAIN,P038_SA} from '../alg-l06-p038-runtime-v1';

const drawing=ALG_L06_P038_DRAWING;
if(drawing.sourceSwfSha256!==
   'bbd60a3b673fc54b3ea44a20943db33ea556532ddc14789a71aed4dadfe1e9de'||
   drawing.mainFrameDomain!=='sprite-67'||drawing.mainFrameCount!==409||
   drawing.rootFrameCount!==13||drawing.rootBeginFrame!==6||drawing.fps!==12||
   P038_MAIN.sourceSha256!==
   '524ae7aa2cc1cb5f85bfe076b785a92c4d29470afdc813e577d93335408ff6fa'||
   P038_SA.sourceSha256!==
   '86aad21a9e9dc50791bdec2ee243dcdbff05302b2f75c23564c3305ef3650fea')
  throw Error('P038_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P038:Object.freeze({version:1 as const,drawing,
    sourceMain:P038_MAIN,optionalSpanishAudio:P038_SA,
    interactionOwner:'maintained-P038PlayerV1-glossary-native-clock' as const,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:false,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
