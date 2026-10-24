'use client';
import React from 'react';
import type {AnimationRendererProps} from '../contract';
import type {LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {CourseG04L09In003Renderer,getCourseG04L09In003FrameState} from '../modules/course-g04-l09-in-003';
import {createIn004VocabularyPresentation,type In004Config} from './g4-l8-in004-presentation';
import data from './g4-l9-in003/source.generated.json';
const config=data.pages[0] as unknown as In004Config;
const {keyTerms:sourceKeyTerms,terminalTimelineAudio:sourceTerminalAudio,...base}=createIn004VocabularyPresentation(config,getCourseG04L09In003FrameState,CourseG04L09In003Renderer);
if(sourceTerminalAudio?.frameDomain!==config.frameDomain||sourceTerminalAudio?.holdFrame!==config.frameCount)throw Error('Own source terminal metadata changed');
if(config.terms.length!==0||sourceKeyTerms?.entryIds.length!==0||sourceKeyTerms?.sourceKeyBindings?.length!==0)throw Error('Own source page must have no glossary controls');
const BaseRenderer=base.Renderer as React.ComponentType<AnimationRendererProps>;
if(!BaseRenderer)throw Error('Own source native renderer is unavailable');
const STYLE="@media(max-width:480px){[data-modern-text-page=\"course-g04-l09-in-003\"].g4l8-in004{padding-inline:.5rem}}[data-modern-text-page=\"course-g04-l09-in-003\"].g4l8-in004 h2{font-size:clamp(1.4rem,4cqi,2rem)}";
function Renderer(props:AnimationRendererProps){return <><style>{STYLE}</style><BaseRenderer {...props}/></>;}
// The original main timeline has no stop. Modern once completion is explicit;
// The complete post-latency source stream is retained; it has no post-hold tail.
export const G4_L9_IN003_TEXT_PRESENTATION={...base,Renderer} satisfies LessonTextPresentationCapability<SourceStaticCanvasFrameState>;
export const G4_L9_IN003_TEXT_BINDING=G4_L9_IN003_TEXT_PRESENTATION.binding;
