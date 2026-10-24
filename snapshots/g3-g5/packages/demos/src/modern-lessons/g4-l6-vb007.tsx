'use client';
import {CourseG04L06Vb007Renderer,getCourseG04L06Vb007FrameState}from'../modules/course-g04-l06-vb-007';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-vocabulary/source.generated.json';
export const G4_L6_VB007_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[3] as unknown as DivisionConfig,getCourseG04L06Vb007FrameState,CourseG04L06Vb007Renderer);
export const G4_L6_VB007_TEXT_BINDING=G4_L6_VB007_TEXT_PRESENTATION.binding;
