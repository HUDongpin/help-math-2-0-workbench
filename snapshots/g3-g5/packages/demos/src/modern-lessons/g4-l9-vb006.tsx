'use client';
import React from 'react';
import {createVocabularyChoicePresentation,type VocabularyChoiceConfig} from './g4-l4-vocabulary-choice';
import {CourseG04L09Vb006Renderer,getCourseG04L09Vb006FrameState} from '../modules/course-g04-l09-vb-006';
import data from './g4-l9-vb006/source.generated.json';
const base=createVocabularyChoicePresentation(data as unknown as VocabularyChoiceConfig,getCourseG04L09Vb006FrameState,CourseG04L09Vb006Renderer);
const BaseRenderer=base.Renderer!;
// Authored source opacity/visibility must change atomically at the reduced-motion stop.
const SOURCE_STATE_CSS="@media(prefers-reduced-motion:reduce){[data-modern-text-page=\"course-g04-l09-vb-006\"] .g4l4-vchoice__equation > span[data-lesson-text-block]{transition:none!important}}";
const Renderer=(props:React.ComponentProps<typeof BaseRenderer>)=><><style>{SOURCE_STATE_CSS}</style><BaseRenderer {...props}/></>;
export const G4_L9_VB006_TEXT_PRESENTATION={...base,Renderer};
export const G4_L9_VB006_TEXT_BINDING=G4_L9_VB006_TEXT_PRESENTATION.binding;
