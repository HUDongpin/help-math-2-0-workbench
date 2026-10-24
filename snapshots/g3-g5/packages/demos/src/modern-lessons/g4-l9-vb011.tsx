'use client';
import {CourseG04L09Vb011Renderer,getCourseG04L09Vb011FrameState}from'../modules/course-g04-l09-vb-011';
import{createDivisionVocabularyPresentation,type DivisionConfig}from'./g4-l6-vocabulary/presentation';
import data from'./g4-l9-vb011/source.generated.json';
export const G4_L9_VB011_TEXT_PRESENTATION=createDivisionVocabularyPresentation(data as unknown as DivisionConfig,getCourseG04L09Vb011FrameState,CourseG04L09Vb011Renderer);
export const G4_L9_VB011_TEXT_BINDING=G4_L9_VB011_TEXT_PRESENTATION.binding;
