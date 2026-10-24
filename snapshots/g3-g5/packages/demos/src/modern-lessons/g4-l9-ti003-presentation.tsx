'use client';
import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {Ti003NativePage} from './g4-l9-ti003-native-page';
import {TI003_TEXT_BINDING,getTi003TextSnapshot} from './g4-l9-ti003-snapshot';
import {G4L9_TI003_FRAME_CONTROL} from './g4-l9-ti003-host-state';
import {TI003_TERMINAL_ACTIVITY_TIMELINES,TI003_MAIN_AUDIO_CUES} from './g4-l9-ti003-terminal-audio';
import COPY from './g4-l9-ti003-terminal/copy.json';
const terms=[...COPY.instructions.runs.flatMap(r=>'term'in r&&r.term?[{...r.term,startFrame:3}]:[]),...COPY.help.body.runs.flatMap(r=>'term'in r&&r.term?[{...r.term,startFrame:658}]:[])];
export const TI003_KEY_TERMS={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:[...new Set(terms.map(t=>t.entryId))],sourceKeyBindings:[...new Map(terms.slice().reverse().map(t=>[t.button,{sourceButtonId:t.button,sourceKey:t.key,frameDomain:'sprite-502',startFrame:t.startFrame,endFrame:658}])).values()]} as const;
/** Uses the exact source module's getter and unchanged legacy fallback. Modern
 * source input/feedback is owned by the existing page reducer and host clocks. */
export function createTi003NativePresentation(getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,Legacy:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 function Renderer(r:AnimationRendererProps){const context={...r,frameDomain:r.frameDomain??'sprite-502',rootFrame:r.rootFrame??6},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;if(getTi003TextSnapshot(state,context).status!=='ready')return <Legacy {...r} state={state}/>;return <Ti003NativePage {...r} frameDomain="sprite-502" rootFrame={6} state={state}/>;}
 return{schemaVersion:1,binding:TI003_TEXT_BINDING,Renderer,getSnapshot:getTi003TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-502':658},reducedMotionFrameByDomain:{'sprite-502':658},frameControl:G4L9_TI003_FRAME_CONTROL,activityTimelines:TI003_TERMINAL_ACTIVITY_TIMELINES,sourceTimelineAudioCues:TI003_MAIN_AUDIO_CUES,keyTerms:TI003_KEY_TERMS};
}
