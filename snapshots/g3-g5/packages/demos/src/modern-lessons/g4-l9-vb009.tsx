'use client';
import React from 'react';
import {createVocabularyChoicePresentation,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {curveAt} from './g4-l5-vocabulary';
import {CourseG04L09Vb009Renderer,getCourseG04L09Vb009FrameState} from '../modules/course-g04-l09-vb-009';
import data from './g4-l9-vb009/source.generated.json';
type Curve<T> = readonly (readonly [number,T])[];
type SourceStyle = {promptAlpha:readonly Curve<number>[];mainGlyphRgb:readonly Curve<readonly number[]>[];correctScale:Curve<number>};
const sourceStyle=data.nativeSourceStyle as unknown as SourceStyle;
const scope='[data-modern-text-page="course-g04-l09-vb-009"]';
export function getG4L9Vb009SourceStyles(requestedFrame:number){
 const frame=Math.max(1,Math.min(123,Math.floor(Number.isFinite(requestedFrame)?requestedFrame:1)));
 const prompt=sourceStyle.promptAlpha.map((curve,index)=>{const alpha=curveAt(curve,frame);return `${scope} [data-lesson-text-block="prompt"] > :nth-child(${index+1}){opacity:${alpha};visibility:${alpha>0?'visible':'hidden'}}`;}).join('');
 const glyphs=sourceStyle.mainGlyphRgb.map((curve,index)=>`${scope} .g4l4-vchoice__estimate > span:nth-child(${index+1}){color:rgb(${curveAt(curve,frame).join(',')})}`).join('');
 const scale=curveAt(sourceStyle.correctScale,frame);
 return prompt+glyphs+`${scope} .g4l4-vchoice__answers [data-choice-focus="left"]{transform:translateX(-50%) scale(${scale});transform-origin:center}`;
}
const base=createVocabularyChoicePresentation(data as unknown as VocabularyChoiceConfig,getCourseG04L09Vb009FrameState,CourseG04L09Vb009Renderer);
const BaseRenderer=base.Renderer!;
const Renderer=(props:React.ComponentProps<typeof BaseRenderer>)=><><style>{getG4L9Vb009SourceStyles(props.frame)}</style><BaseRenderer {...props}/></>;
export const G4_L9_VB009_TEXT_PRESENTATION={...base,Renderer};
export const G4_L9_VB009_TEXT_BINDING=G4_L9_VB009_TEXT_PRESENTATION.binding;
