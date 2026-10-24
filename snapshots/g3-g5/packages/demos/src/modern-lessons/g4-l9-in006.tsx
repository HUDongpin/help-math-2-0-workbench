'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L09In006Renderer,getCourseG04L09In006FrameState} from '../modules/course-g04-l09-in-006';
import {createDivisionVocabularyPresentation,type DivisionConfig} from './g4-l6-vocabulary/presentation';
import data from './g4-l9-in006/source.generated.json';
import {curveAt} from './g4-l5-vocabulary';
const config=data.pages[0] as unknown as DivisionConfig;
const base=createDivisionVocabularyPresentation(config,getCourseG04L09In006FrameState,CourseG04L09In006Renderer);
const BaseRenderer=base.Renderer as React.ComponentType<AnimationRendererProps>;
if(!BaseRenderer)throw Error('Own source native renderer is unavailable');
const STYLE="@media(max-width:480px){[data-modern-text-page=\"course-g04-l09-in-006\"].g4l6-vocabulary{padding-inline:.5rem}}";
// Exact source character56 arrow placements use the existing KaTeX symbol face.
const ARROW_BLOCKS=["text-56-depth-107","text-56-depth-108","text-56-depth-110","text-56-depth-112","text-56-depth-114","text-56-depth-116","text-56-depth-118","text-56-depth-121","text-56-depth-123"];
const ARROW_STYLE=ARROW_BLOCKS.map(block=>'[data-modern-text-page="course-g04-l09-in-006"] [data-lesson-text-block="'+block+'"]>.g4l6-vocabulary__label{font-family:KaTeX_Main;font-weight:400}').join('');
type UniformScaleLabel={readonly block:string;readonly scaleCurve:readonly(readonly[number,number])[]};
const UNIFORM_SCALE_LABELS=data.pages[0].nativeUniformScaleLabels as unknown as readonly UniformScaleLabel[];
export function getG4L9In006IntroScaleStyle(frame:number){return UNIFORM_SCALE_LABELS.map((label,index)=>{
 const scale=curveAt(label.scaleCurve,frame),minimumFontPx=Math.ceil(16000/scale)/1000;
 return '[data-modern-text-page="course-g04-l09-in-006"] [data-lesson-text-block="'+label.block+'"]>.g4l6-vocabulary__label{transform:translate(-50%,-50%) scale('+scale+');transform-origin:50% 50%;font-size:max(1.375rem,'+minimumFontPx+'px);margin-left:'+((index-(UNIFORM_SCALE_LABELS.length-1)/2)/8)+'rem}';
}).join('');}
function Renderer(props:AnimationRendererProps){const context={...props,frameDomain:props.frameDomain??config.frameDomain};const state=(props.state??getCourseG04L09In006FrameState(props.frame,context)) as SourceStaticCanvasFrameState;return <><style>{STYLE+ARROW_STYLE+getG4L9In006IntroScaleStyle(state.frame)}</style><BaseRenderer {...props} state={state}/></>;}
// The nine introductory glyphs retain their own source-center motion and scale.
// Symmetric 0.125rem tracking around the middle glyph separates enlarged native
// letters; the fixed offsets preserve each source trajectory delta, alpha and timing.
// The original main timeline has no stop. Modern once completion is explicit;
// preserve all post-head source audio samples and the established terminal tail.
export const G4_L9_IN006_TEXT_PRESENTATION={...base,Renderer,terminalTimelineAudio:{...data.pages[0].terminalTimelineAudio,allowClockDriftTail:true as const}} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G4_L9_IN006_TEXT_BINDING=G4_L9_IN006_TEXT_PRESENTATION.binding;
