'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L09In012Renderer,getCourseG04L09In012FrameState} from '../modules/course-g04-l09-in-012';
import {createDivisionVocabularyPresentation,type DivisionConfig} from './g4-l6-vocabulary/presentation';
import data from './g4-l9-in012/source.generated.json';
const config=data.pages[0] as unknown as DivisionConfig;
const base=createDivisionVocabularyPresentation(config,getCourseG04L09In012FrameState,CourseG04L09In012Renderer);
const BaseRenderer=base.Renderer as React.ComponentType<AnimationRendererProps>;
if(!BaseRenderer)throw Error('Own source native renderer is unavailable');
const STYLE="@media(max-width:480px){[data-modern-text-page=\"course-g04-l09-in-012\"].g4l6-vocabulary{padding-inline:.5rem}}";
function Renderer(props:AnimationRendererProps){return <><style>{STYLE}</style><BaseRenderer {...props}/></>;}
// The original main timeline has no stop. Modern once completion is explicit;
// preserve all post-head source audio samples and the established terminal tail.
export const G4_L9_IN012_TEXT_PRESENTATION={...base,Renderer,terminalTimelineAudio:{...data.pages[0].terminalTimelineAudio,allowClockDriftTail:true as const}} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G4_L9_IN012_TEXT_BINDING=G4_L9_IN012_TEXT_PRESENTATION.binding;
