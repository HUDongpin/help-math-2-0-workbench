'use client';
import {CourseG04L06Vb003Renderer,getCourseG04L06Vb003FrameState}from'../modules/course-g04-l06-vb-003';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-vocabulary/source.generated.json';
export const G4_L6_VB003_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[1] as unknown as DivisionConfig,getCourseG04L06Vb003FrameState,CourseG04L06Vb003Renderer);
export const G4_L6_VB003_TEXT_BINDING=G4_L6_VB003_TEXT_PRESENTATION.binding;
