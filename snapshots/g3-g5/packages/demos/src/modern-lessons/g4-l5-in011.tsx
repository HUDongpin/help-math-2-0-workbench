'use client';
import {COURSE_G04_L05_IN_011_RENDERER as Fallback,getCourseG04L05In011FrameState} from '../modules/course-g04-l05-in-011';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_IN011_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[9],getCourseG04L05In011FrameState,Fallback);
export const G4_L5_IN011_TEXT_BINDING=G4_L5_IN011_TEXT_PRESENTATION.binding;
