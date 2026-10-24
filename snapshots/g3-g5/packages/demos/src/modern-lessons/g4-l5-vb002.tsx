'use client';
import {CourseG04L05Vb002Renderer,getCourseG04L05Vb002FrameState} from '../modules/course-g04-l05-vb-002';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB002_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[0],getCourseG04L05Vb002FrameState,CourseG04L05Vb002Renderer);
export const G4_L5_VB002_TEXT_BINDING=G4_L5_VB002_TEXT_PRESENTATION.binding;
