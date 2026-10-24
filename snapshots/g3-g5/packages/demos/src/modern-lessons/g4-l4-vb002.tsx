'use client';
import {CourseG04L04Vb002Renderer,getCourseG04L04Vb002FrameState} from '../modules/course-g04-l04-vb-002';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB002_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[0],getCourseG04L04Vb002FrameState,CourseG04L04Vb002Renderer);
export const G4_L4_VB002_TEXT_BINDING=G4_L4_VB002_TEXT_PRESENTATION.binding;
