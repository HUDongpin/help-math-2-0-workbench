'use client';
import React from 'react';
import type {AnimationRendererProps,RuntimeContext} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {Ti004NativePage} from './g4-l9-ti004-native-page';
import {TI004_TEXT_BINDING,getTi004TextSnapshot} from './g4-l9-ti004-snapshot';
import {TI004_FRAME_CONTROL} from './g4-l9-ti004-host-state';
import {TI004_ACTIVITY_TIMELINES,TI004_MAIN_AUDIO_CUES} from './g4-l9-ti004-terminal-audio';
import COPY from './g4-l9-ti004-terminal/copy.json';
const terms=[...COPY.instructions.runs.flatMap(r=>'term'in r&&r.term?[{...r.term,startFrame:4,endFrame:119}]:[]),...COPY.help.body.runs.flatMap(r=>'term'in r&&r.term?[{...r.term,startFrame:118,endFrame:118}]:[])];
export const TI004_KEY_TERMS={indexLanguage:'en',sourceAssetId:'ELKTEG4.xml',sourceSha256:'bec389ce286b9a113297dfd87e052f28cf1da2640d93a277f91f669dfb3ef749',entryIds:[...new Set(terms.map(t=>t.entryId))],sourceKeyBindings:terms.map(t=>({sourceButtonId:t.button,sourceKey:t.key,frameDomain:'sprite-134',startFrame:t.startFrame,endFrame:t.endFrame}))} as const;
export function createTi004NativePresentation(getFrameState:(frame:number,context:RuntimeContext)=>SourceStaticCanvasFrameState,Legacy:React.ComponentType<AnimationRendererProps>):LessonTextPresentationCapability<SourceStaticCanvasFrameState>{
 function Renderer(r:AnimationRendererProps){const context={...r,frameDomain:r.frameDomain??'sprite-134',rootFrame:r.rootFrame??6},state=(r.state??getFrameState(r.frame,context))as SourceStaticCanvasFrameState;if(getTi004TextSnapshot(state,context).status!=='ready')return <Legacy {...r} state={state}/>;return <Ti004NativePage {...r} frameDomain="sprite-134" rootFrame={6} state={state}/>;}
 return{schemaVersion:1,binding:TI004_TEXT_BINDING,Renderer,getSnapshot:getTi004TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-134':118},reducedMotionFrameByDomain:{'sprite-134':118},frameControl:TI004_FRAME_CONTROL,activityTimelines:TI004_ACTIVITY_TIMELINES,sourceTimelineAudioCues:TI004_MAIN_AUDIO_CUES,keyTerms:TI004_KEY_TERMS};
}
