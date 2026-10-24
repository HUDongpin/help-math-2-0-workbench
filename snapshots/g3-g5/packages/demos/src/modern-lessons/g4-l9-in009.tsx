'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L09In009Renderer,getCourseG04L09In009FrameState} from '../modules/course-g04-l09-in-009';
import {createDivisionVocabularyPresentation,type DivisionConfig} from './g4-l6-vocabulary/presentation';
import data from './g4-l9-in009/source.generated.json';
const config=data as unknown as DivisionConfig;
const base=createDivisionVocabularyPresentation(config,getCourseG04L09In009FrameState,CourseG04L09In009Renderer);
const BaseRenderer=base.Renderer as React.ComponentType<AnimationRendererProps>;
if(!BaseRenderer)throw Error('Own source native renderer is unavailable');
// Every own text instance has one positive diagonal linear transform. Preserve
// that exact source transform while keeping its painted native font at least16px.
const FONT_STYLE=config.nativeAffineLabels!.map(label=>{
 const matrices=label.states.flatMap(([,matrix])=>matrix?[matrix]:[]),first=matrices[0];
 if(!first||matrices.some(matrix=>matrix[1]!==0||matrix[2]!==0||matrix[0]!==first[0]||matrix[3]!==first[3]||matrix[0]<=0||matrix[3]<=0))throw Error('Own IN009 label linear transform changed');
 const minimumFontPx=Math.ceil(16000/Math.min(first[0]!,first[3]!))/1000;
 return '[data-modern-text-page="course-g04-l09-in-009"] [data-native-source-affine="'+label.block+'"]>.g4l6-vocabulary__label{font-size:max(1.375rem,'+minimumFontPx+'px)}';
}).join('');
function Renderer(props:AnimationRendererProps){return <><style>{FONT_STYLE+'@media(max-width:480px){.g4l6-vocabulary[data-modern-text-page="course-g04-l09-in-009"]{padding-inline:.75rem}.g4l6-vocabulary[data-modern-text-page="course-g04-l09-in-009"]>h2{overflow-wrap:normal;word-break:normal}}'}</style><BaseRenderer {...props}/></>;}
// Source has no terminal stop. Modern once completion is explicit; source-loop
// fidelity and listening remain separate, including81 missing stream-block frames.
export const G4_L9_IN009_TEXT_PRESENTATION={...base,Renderer,keyTerms:undefined} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G4_L9_IN009_TEXT_BINDING=G4_L9_IN009_TEXT_PRESENTATION.binding;
