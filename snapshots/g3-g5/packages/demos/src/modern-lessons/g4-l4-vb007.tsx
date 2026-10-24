'use client';
import {CourseG04L04Vb007Renderer,getCourseG04L04Vb007FrameState} from '../modules/course-g04-l04-vb-007';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB007_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[4],getCourseG04L04Vb007FrameState,CourseG04L04Vb007Renderer);
export const G4_L4_VB007_TEXT_BINDING=G4_L4_VB007_TEXT_PRESENTATION.binding;
