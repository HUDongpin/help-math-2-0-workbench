'use client';
import {CourseG04L06Vb012Renderer,getCourseG04L06Vb012FrameState}from'../modules/course-g04-l06-vb-012';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-vocabulary/source.generated.json';
export const G4_L6_VB012_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[5] as unknown as DivisionConfig,getCourseG04L06Vb012FrameState,CourseG04L06Vb012Renderer);
export const G4_L6_VB012_TEXT_BINDING=G4_L6_VB012_TEXT_PRESENTATION.binding;
