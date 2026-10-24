'use client';
import {CourseG04L05Vb007Renderer,getCourseG04L05Vb007FrameState} from '../modules/course-g04-l05-vb-007';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB007_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[3],getCourseG04L05Vb007FrameState,CourseG04L05Vb007Renderer);
export const G4_L5_VB007_TEXT_BINDING=G4_L5_VB007_TEXT_PRESENTATION.binding;
