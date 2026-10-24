'use client';
import {CourseG04L05Vb012Renderer,getCourseG04L05Vb012FrameState} from '../modules/course-g04-l05-vb-012';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB012_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[6],getCourseG04L05Vb012FrameState,CourseG04L05Vb012Renderer);
export const G4_L5_VB012_TEXT_BINDING=G4_L5_VB012_TEXT_PRESENTATION.binding;
