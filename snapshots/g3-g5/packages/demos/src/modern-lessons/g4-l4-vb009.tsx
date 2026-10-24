'use client';
import {CourseG04L04Vb009Renderer,getCourseG04L04Vb009FrameState} from '../modules/course-g04-l04-vb-009';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB009_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[5],getCourseG04L04Vb009FrameState,CourseG04L04Vb009Renderer);
export const G4_L4_VB009_TEXT_BINDING=G4_L4_VB009_TEXT_PRESENTATION.binding;
