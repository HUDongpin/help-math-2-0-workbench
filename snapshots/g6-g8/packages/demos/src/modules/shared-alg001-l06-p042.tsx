/** P042 registry drawing module; the source behavior and audio are page owned. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P042_DRAWING} from '../timelines/shared-alg001-l06-p042';

const drawing=ALG_L06_P042_DRAWING;
if(drawing.sourceSwfSha256!==
   '7df2077da472138df83a4485c0e15b7f3b1063aefcdcf2e3ded9232c98f68fcb'||
   drawing.assetSha256!==
   '8eebb94446a095f5219bc5b3b46f740179d92e8ee6260a6a5cfa2d9d34fae8f4'||
   drawing.mainFrameDomain!=='sprite-341'||drawing.mainFrameCount!==400||
   drawing.rootFrameCount!==10||drawing.rootBeginFrame!==6||drawing.fps!==12)
  throw Error('P042_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P042:Object.freeze({version:1 as const,drawing,
    sourceQuizStopFrame:279,wrongFeedbackSprite:292,rightFeedbackSprite:239,
    feedbackOwner:'P042PageRuntimeV1' as const,
    audioOwner:'P042AudioOwnerV1' as const,sourceAudioStreamCount:3,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:false,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
