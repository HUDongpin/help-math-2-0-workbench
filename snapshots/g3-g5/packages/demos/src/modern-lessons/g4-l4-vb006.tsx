'use client';
import {CourseG04L04Vb006Renderer,getCourseG04L04Vb006FrameState} from '../modules/course-g04-l04-vb-006';
import {createVocabularyPresentation} from './g4-l4-vocabulary-equations';
import {G4_L4_VOCABULARY_CONFIGS} from './generated/g4-l4-vocabulary-config';
export const G4_L4_VB006_TEXT_PRESENTATION=createVocabularyPresentation(G4_L4_VOCABULARY_CONFIGS[3],getCourseG04L04Vb006FrameState,CourseG04L04Vb006Renderer);
export const G4_L4_VB006_TEXT_BINDING=G4_L4_VB006_TEXT_PRESENTATION.binding;
