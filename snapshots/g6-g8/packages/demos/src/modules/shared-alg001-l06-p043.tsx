/** P043 registry drawing module; source behavior and audio are page owned. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P043_DRAWING} from '../timelines/shared-alg001-l06-p043';

const drawing=ALG_L06_P043_DRAWING;
if(drawing.sourceSwfSha256!==
   '8bec405895d09cc8f7dd9f0da197f67726cb45cab6cc8dec3d15b103bc04a97b'||
   drawing.assetSha256!==
   '4ef3fd48ec83ba97542791832682e0a14aabec52611d7a4f6f0750e5b4852de5'||
   drawing.mainFrameDomain!=='sprite-342'||drawing.mainFrameCount!==241||
   drawing.rootFrameCount!==10||drawing.rootBeginFrame!==6||drawing.fps!==12)
  throw Error('P043_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P043:Object.freeze({version:1 as const,drawing,
    sourceQuizStopFrame:62,wrongFeedbackSprite:307,rightFeedbackSprite:202,
    feedbackOwner:'P043PageRuntimeV1' as const,
    audioOwner:'P043AudioOwnerV1' as const,sourceAudioStreamCount:3,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:false,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
