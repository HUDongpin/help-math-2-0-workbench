'use client';
import {CourseG04L08Vb002Renderer,getCourseG04L08Vb002FrameState}from'../modules/course-g04-l08-vb-002';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l8-vocabulary/source.generated.json';
export const G4_L8_VB002_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[0] as unknown as DivisionConfig,getCourseG04L08Vb002FrameState,CourseG04L08Vb002Renderer);
export const G4_L8_VB002_TEXT_BINDING=G4_L8_VB002_TEXT_PRESENTATION.binding;
