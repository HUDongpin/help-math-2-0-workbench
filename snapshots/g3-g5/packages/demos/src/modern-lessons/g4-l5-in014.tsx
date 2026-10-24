'use client';
import {COURSE_G04_L05_IN_014_RENDERER as Fallback,getCourseG04L05In014FrameState} from '../modules/course-g04-l05-in-014';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_IN014_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[10],getCourseG04L05In014FrameState,Fallback);
export const G4_L5_IN014_TEXT_BINDING=G4_L5_IN014_TEXT_PRESENTATION.binding;
