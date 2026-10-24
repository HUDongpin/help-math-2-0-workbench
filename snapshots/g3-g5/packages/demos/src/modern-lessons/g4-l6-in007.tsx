'use client';
import React from'react';
import type{AnimationRendererProps}from'../contract';
import {CourseG04L06In007Renderer,getCourseG04L06In007FrameState}from'../modules/course-g04-l06-in-007';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-in007/source.generated.json';
const base=createDivisionVocabularyPresentation(data.pages[0] as unknown as DivisionConfig,getCourseG04L06In007FrameState,CourseG04L06In007Renderer);
const SourceRenderer=base.Renderer!;
// Native-font spacing for the source remainder numeral; its outer source anchor stays unchanged.
const REMAINDER_SPACING='[data-modern-text-page="course-g04-l06-in-007"] [data-lesson-text-block="text-29-depth-13"] [data-lesson-text-token="0"]{position:relative;left:.3em}';
function In007Renderer(props:AnimationRendererProps){return <><style data-in007-remainder-spacing="0.3em">{REMAINDER_SPACING}</style><SourceRenderer {...props}/></>;}
export const G4_L6_IN007_TEXT_PRESENTATION={...base,Renderer:In007Renderer};
export const G4_L6_IN007_TEXT_BINDING=G4_L6_IN007_TEXT_PRESENTATION.binding;
