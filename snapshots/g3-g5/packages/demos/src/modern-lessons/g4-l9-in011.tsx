'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import {createVocabularyChoicePresentation,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {numberLineValue as at} from './g4-l4-number-line';
import {CourseG04L09In011Renderer,getCourseG04L09In011FrameState} from '../modules/course-g04-l09-in-011';
import source from './g4-l9-in011/source.generated.json';
type Curve<T>=readonly(readonly[number,T])[];
type Geometry=Readonly<{x:number;y:number;scale:number;alpha:number;sourceInstance:string|null}>;
const config=source as unknown as VocabularyChoiceConfig&{
 readonly ownNativeGeometry:Readonly<Record<string,Curve<Geometry>>>;
 readonly ownSourceBoard:Readonly<{left:number;right:number;top:number;bottom:number;inlineRem:number}>;
 readonly ownPromptWordAlpha:readonly Curve<number>[];
};
const base=createVocabularyChoicePresentation(config,getCourseG04L09In011FrameState,CourseG04L09In011Renderer),BaseRenderer=base.Renderer!;
const root='[data-modern-text-page="course-g04-l09-in-011"]';
const STYLE=`${root} .g4l4-vchoice__equation{position:relative;display:block;block-size:${config.ownSourceBoard.inlineRem*(config.ownSourceBoard.bottom-config.ownSourceBoard.top)/(config.ownSourceBoard.right-config.ownSourceBoard.left)}rem}${root} .g4l4-vchoice__equation>[data-lesson-text-block]{position:absolute;transform-origin:50% 50%}${root} .g4l4-vchoice__equation>[data-lesson-text-block^="equation-"]{white-space:pre}
@media(max-width:480px){${root}.g4l4-vchoice{padding-inline:.5rem}}`;
/** Preserve source centers, authored correct-answer center travel and alpha.
 * Complete source-word and formula-unit masks become atomic native text; source colors and
 * both glossary instances remain in the maintained semantic choice surface. */
export function getG4L9In011NativeStyle(frame:number){
 const b=config.ownSourceBoard,unit=b.inlineRem/(b.right-b.left);
 const geometry=Object.entries(config.ownNativeGeometry).map(([id,curve])=>{const p=at(curve,frame,curve[0]![1]);return `${root} .g4l4-vchoice__equation>[data-lesson-text-block="${id}"]{left:${(p.x-b.left)*unit}rem;top:${(p.y-b.top)*unit}rem;transform:translate(-50%,-50%) scale(${p.scale})}`;}).join('');
 const prompt=config.ownPromptWordAlpha.map((curve,i)=>{const alpha=at(curve,frame,0);return `${root} [data-lesson-text-block="prompt"]>:nth-child(${i+1}){opacity:${alpha};visibility:${alpha>0?'visible':'hidden'}}`;}).join('');
 return STYLE+geometry+prompt;
}
function Renderer(props:AnimationRendererProps){return <><style>{getG4L9In011NativeStyle(props.frame)}</style><BaseRenderer {...props}/></>;}
export const G4_L9_IN011_TEXT_PRESENTATION={...base,Renderer};
export const G4_L9_IN011_TEXT_BINDING=G4_L9_IN011_TEXT_PRESENTATION.binding;
