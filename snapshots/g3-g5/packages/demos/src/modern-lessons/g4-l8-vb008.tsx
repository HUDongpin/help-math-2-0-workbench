'use client';
import {CourseG04L08Vb008Renderer,getCourseG04L08Vb008FrameState}from'../modules/course-g04-l08-vb-008';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l8-vb008/source.generated.json';
export const G4_L8_VB008_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[0] as unknown as DivisionConfig,getCourseG04L08Vb008FrameState,CourseG04L08Vb008Renderer);
export const G4_L8_VB008_TEXT_BINDING=G4_L8_VB008_TEXT_PRESENTATION.binding;
