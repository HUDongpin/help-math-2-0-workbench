'use client';
import {CourseG04L08Vb010Renderer,getCourseG04L08Vb010FrameState}from'../modules/course-g04-l08-vb-010';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l8-vocabulary/source.generated.json';
export const G4_L8_VB010_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[1] as unknown as DivisionConfig,getCourseG04L08Vb010FrameState,CourseG04L08Vb010Renderer);
export const G4_L8_VB010_TEXT_BINDING=G4_L8_VB010_TEXT_PRESENTATION.binding;
