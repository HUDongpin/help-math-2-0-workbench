'use client';
import {CourseG04L05Vb013Renderer,getCourseG04L05Vb013FrameState} from '../modules/course-g04-l05-vb-013';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB013_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[5],getCourseG04L05Vb013FrameState,CourseG04L05Vb013Renderer);
export const G4_L5_VB013_TEXT_BINDING=G4_L5_VB013_TEXT_PRESENTATION.binding;
