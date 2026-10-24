/** P041 registry drawing module. P041PlayerV1 owns source behavior and audio. */
'use client';
import {createSourceStaticCanvasCandidate} from '../source-static-canvas-candidate';
import {ALG_L06_P041_DRAWING} from '../timelines/shared-alg001-l06-p041';

const drawing=ALG_L06_P041_DRAWING;
if(drawing.sourceSwfSha256!==
   'bb10cab8e835f2c3267e0add3774dc47fa38863fe12dab67f3199e4c0efadd85'||
   drawing.assetSha256!==
   '77cdf78caf76bc825e4c8cbdc5f511dd377da9b289018a53cf1c72c7f3ad5923'||
   drawing.mainFrameDomain!=='sprite-169'||drawing.mainFrameCount!==869||
   drawing.rootFrameCount!==10||drawing.rootBeginFrame!==6||drawing.fps!==12)
  throw Error('P041_DRAWING_SOURCE_IDENTITY_MISMATCH');

const candidate=createSourceStaticCanvasCandidate(drawing);
export default Object.freeze({...candidate.module,maturity:'private-current-js' as const,
  privateAlgL06P041:Object.freeze({version:1 as const,drawing,
    sourceQuizStopFrame:752,feedbackOwner:'P041PageRuntimeV1' as const,
    audioOwner:'P041AudioOwnerV1' as const,sourceAudioStreamCount:8,
    canvasSourceGlyphsPreserved:true,nativeTextStageOverlay:true,
    optionalSpanishTrigger:'explicit-user-only' as const,
    mainStreamSpliced:false,sourceTerminalStopVerified:false,
    originalRuntimeParity:false,audioAccepted:false})});
