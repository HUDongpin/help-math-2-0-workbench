'use client';
import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {In004NativePage} from './g4-l9-in004-native-page';
import {IN004_TEXT_BINDING,getIn004TextSnapshot} from './g4-l9-in004-snapshot';
import {G4L9_IN004_FRAME_CONTROL} from './g4-l9-in004-host-state';
import {IN004_TERMINAL_ACTIVITY_TIMELINES,IN004_MAIN_AUDIO_CUES} from './g4-l9-in004-terminal-audio';
import COPY from './g4-l9-in004-terminal/copy.json';
const terms=COPY.instructions.runs.flatMap(r=>'term'in r&&r.term?[r.term]:[]);
export const IN004_KEY_TERMS={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:[...new Set(terms.map(t=>t.entryId))],sourceKeyBindings:[...new Map(terms.map(t=>[t.button,{sourceButtonId:t.button,sourceKey:t.key,frameDomain:'sprite-405',startFrame:3,endFrame:695}])).values()]} as const;
/** Uses the exact source module's getter and unchanged legacy fallback. Modern
 * source input/feedback is owned by the existing page reducer and host clocks. */
export function createIn004NativePresentation(getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,Legacy:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 function Renderer(r:AnimationRendererProps){const context={...r,frameDomain:r.frameDomain??'sprite-405',rootFrame:r.rootFrame??6},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;if(getIn004TextSnapshot(state,context).status!=='ready')return <Legacy {...r} state={state}/>;return <In004NativePage {...r} frameDomain="sprite-405" rootFrame={6} state={state}/>;}
 return{schemaVersion:1,binding:IN004_TEXT_BINDING,Renderer,getSnapshot:getIn004TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-405':695},reducedMotionFrameByDomain:{'sprite-405':695},frameControl:G4L9_IN004_FRAME_CONTROL,activityTimelines:IN004_TERMINAL_ACTIVITY_TIMELINES,sourceTimelineAudioCues:IN004_MAIN_AUDIO_CUES,keyTerms:IN004_KEY_TERMS};
}
