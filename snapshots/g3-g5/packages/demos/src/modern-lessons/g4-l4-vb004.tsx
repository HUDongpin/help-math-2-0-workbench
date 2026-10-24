'use client';
import {CourseG04L04Vb004Renderer,getCourseG04L04Vb004FrameState} from '../modules/course-g04-l04-vb-004';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB004_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[2],getCourseG04L04Vb004FrameState,CourseG04L04Vb004Renderer);
export const G4_L4_VB004_TEXT_BINDING=G4_L4_VB004_TEXT_PRESENTATION.binding;
