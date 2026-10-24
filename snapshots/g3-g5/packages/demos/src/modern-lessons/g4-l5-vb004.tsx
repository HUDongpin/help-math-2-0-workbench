'use client';
import {CourseG04L05Vb004Renderer,getCourseG04L05Vb004FrameState} from '../modules/course-g04-l05-vb-004';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB004_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[2],getCourseG04L05Vb004FrameState,CourseG04L05Vb004Renderer);
export const G4_L5_VB004_TEXT_BINDING=G4_L5_VB004_TEXT_PRESENTATION.binding;
