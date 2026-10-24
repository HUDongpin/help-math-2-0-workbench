'use client';
import {COURSE_G04_L05_IN_002_RENDERER as Fallback,getCourseG04L05In002FrameState} from '../modules/course-g04-l05-in-002';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_IN002_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[12],getCourseG04L05In002FrameState,Fallback);
export const G4_L5_IN002_TEXT_BINDING=G4_L5_IN002_TEXT_PRESENTATION.binding;
