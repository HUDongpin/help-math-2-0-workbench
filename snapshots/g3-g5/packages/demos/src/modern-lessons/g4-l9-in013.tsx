'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import {createVocabularyChoicePresentation,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {numberLineValue as at} from './g4-l4-number-line';
import {CourseG04L09In013Renderer,getCourseG04L09In013FrameState} from '../modules/course-g04-l09-in-013';
import source from './g4-l9-in013/source.generated.json';
type Curve<T>=readonly(readonly[number,T])[];
const config=source as unknown as VocabularyChoiceConfig&{
 readonly ownNativeGeometry:Readonly<Record<string,Curve<Readonly<{x:number;y:number;scale:number;alpha:number;sourceInstance:string|null}>>>>;
 readonly ownPromptWordAlpha:readonly Curve<number>[];
};
const base=createVocabularyChoicePresentation(config,getCourseG04L09In013FrameState,CourseG04L09In013Renderer),BaseRenderer=base.Renderer!;
const root='[data-modern-text-page="course-g04-l09-in-013"]';
const STYLE=`${root} .g4l4-vchoice__equation{position:relative;display:block;block-size:15rem;white-space:normal}${root} .g4l4-vchoice__equation>[data-lesson-text-block]{position:absolute;left:50%;transform:translate(-50%,-50%);white-space:normal;overflow-wrap:normal;word-break:normal;hyphens:none;line-height:1.4}
@media(max-width:480px){${root}.g4l4-vchoice{padding-inline:.5rem}}`;
/** Keep source vertical ordering and third-answer motion to the middle row.
 * Horizontal centering and expanded native row gaps are typography choices;
 * source rectangles/absolute horizontal coordinates are not fidelity claims. */
export function getG4L9In013NativeStyle(frame:number){
 const rows=Object.entries(config.ownNativeGeometry).map(([id,curve])=>{const p=at(curve,frame,curve[0]![1]);return `${root} .g4l4-vchoice__equation>[data-lesson-text-block="${id}"]{top:${2+5*(p.y+1485)/1000}rem}`;}).join('');
 const words=config.ownPromptWordAlpha.map((curve,i)=>{const alpha=at(curve,frame,0);return `${root} [data-lesson-text-block="prompt"]>:nth-child(${i+1}){opacity:${alpha};visibility:${alpha>0?'visible':'hidden'}}`;}).join('');
 return STYLE+rows+words;
}
function Renderer(props:AnimationRendererProps){return <><style>{getG4L9In013NativeStyle(props.frame)}</style><BaseRenderer {...props}/></>;}
export const G4_L9_IN013_TEXT_PRESENTATION={...base,Renderer};
export const G4_L9_IN013_TEXT_BINDING=G4_L9_IN013_TEXT_PRESENTATION.binding;
