'use client';
import {CourseG04L06Vb004Renderer,getCourseG04L06Vb004FrameState}from'../modules/course-g04-l06-vb-004';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l6-vocabulary/source.generated.json';
export const G4_L6_VB004_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data.pages[2] as unknown as DivisionConfig,getCourseG04L06Vb004FrameState,CourseG04L06Vb004Renderer);
export const G4_L6_VB004_TEXT_BINDING=G4_L6_VB004_TEXT_PRESENTATION.binding;
