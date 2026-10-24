'use client';
import {CourseG04L05Vb014Renderer,getCourseG04L05Vb014FrameState} from '../modules/course-g04-l05-vb-014';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB014_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[7],getCourseG04L05Vb014FrameState,CourseG04L05Vb014Renderer);
export const G4_L5_VB014_TEXT_BINDING=G4_L5_VB014_TEXT_PRESENTATION.binding;
