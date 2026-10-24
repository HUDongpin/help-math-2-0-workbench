'use client';
import {CourseG04L04Vb003Renderer,getCourseG04L04Vb003FrameState} from '../modules/course-g04-l04-vb-003';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB003_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[1],getCourseG04L04Vb003FrameState,CourseG04L04Vb003Renderer);
export const G4_L4_VB003_TEXT_BINDING=G4_L4_VB003_TEXT_PRESENTATION.binding;
