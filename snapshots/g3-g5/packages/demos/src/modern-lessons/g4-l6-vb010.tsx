'use client';
import {CourseG04L06Vb010Renderer,getCourseG04L06Vb010FrameState}from'../modules/course-g04-l06-vb-010';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-vocabulary/source.generated.json';
export const G4_L6_VB010_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[4] as unknown as DivisionConfig,getCourseG04L06Vb010FrameState,CourseG04L06Vb010Renderer);
export const G4_L6_VB010_TEXT_BINDING=G4_L6_VB010_TEXT_PRESENTATION.binding;
