'use client';
import {CourseG04L05Vb003Renderer,getCourseG04L05Vb003FrameState} from '../modules/course-g04-l05-vb-003';
import {createVocabularyPresentation} from './g4-l5-vocabulary';
import {G4_L5_VOCABULARY_CONFIGS} from './generated/g4-l5-vocabulary-config';
export const G4_L5_VB003_TEXT_PRESENTATION=createVocabularyPresentation(G4_L5_VOCABULARY_CONFIGS[1],getCourseG04L05Vb003FrameState,CourseG04L05Vb003Renderer);
export const G4_L5_VB003_TEXT_BINDING=G4_L5_VB003_TEXT_PRESENTATION.binding;
