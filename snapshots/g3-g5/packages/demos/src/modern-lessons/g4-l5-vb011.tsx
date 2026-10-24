'use client';
import {CourseG04L05Vb011Renderer,getCourseG04L05Vb011FrameState} from '../modules/course-g04-l05-vb-011';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB011_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[4],getCourseG04L05Vb011FrameState,CourseG04L05Vb011Renderer);
export const G4_L5_VB011_TEXT_BINDING=G4_L5_VB011_TEXT_PRESENTATION.binding;
