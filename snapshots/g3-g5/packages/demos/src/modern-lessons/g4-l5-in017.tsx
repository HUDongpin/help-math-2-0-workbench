'use client';
import {CourseG04L05In017Renderer,getCourseG04L05In017FrameState} from '../modules/course-g04-l05-in-017';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_IN017_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[8],getCourseG04L05In017FrameState,CourseG04L05In017Renderer);
export const G4_L5_IN017_TEXT_BINDING=G4_L5_IN017_TEXT_PRESENTATION.binding;
