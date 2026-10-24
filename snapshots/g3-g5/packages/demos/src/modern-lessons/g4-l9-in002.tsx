'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L09In002Renderer,getCourseG04L09In002FrameState} from '../modules/course-g04-l09-in-002';
import {createDivisionVocabularyPresentation,type DivisionConfig} from './g4-l6-vocabulary/presentation';
import data from './g4-l9-in002/source.generated.json';
const config=data.pages[0] as unknown as DivisionConfig;
const base=createDivisionVocabularyPresentation(config,getCourseG04L09In002FrameState,CourseG04L09In002Renderer);
const BaseRenderer=base.Renderer as React.ComponentType<AnimationRendererProps>;
if(!BaseRenderer)throw Error('Own source native renderer is unavailable');
const STYLE="@media(max-width:480px){[data-modern-text-page=\"course-g04-l09-in-002\"].g4l6-vocabulary{padding-inline:.5rem}}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-19\"]>.g4l6-vocabulary__label{white-space:normal;inline-size:22.394668rem;text-align:center}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-19\"] .g4l6-vocabulary__word{white-space:normal}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-19\"] .g4l6-vocabulary__term .g4l6-vocabulary__word{white-space:pre}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-19\"] [data-lesson-text-token=\"8\"]::before{content:\"\\A\";white-space:pre}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-31\"]>.g4l6-vocabulary__label{white-space:normal;inline-size:16.972095rem;text-align:center}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-31\"] .g4l6-vocabulary__word{white-space:normal}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-31\"] .g4l6-vocabulary__term .g4l6-vocabulary__word{white-space:pre}[data-modern-text-page=\"course-g04-l09-in-002\"] [data-lesson-text-block=\"text-31\"] [data-lesson-text-token=\"3\"]::before{content:\"\\A\";white-space:pre}";
function Renderer(props:AnimationRendererProps){return <><style>{STYLE}</style><BaseRenderer {...props}/></>;}
// The original main timeline has no stop. Modern once completion is explicit;
// preserve all post-head source audio samples and the established terminal tail.
export const G4_L9_IN002_TEXT_PRESENTATION={...base,Renderer,terminalTimelineAudio:{...data.pages[0].terminalTimelineAudio,allowClockDriftTail:true as const}} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G4_L9_IN002_TEXT_BINDING=G4_L9_IN002_TEXT_PRESENTATION.binding;
