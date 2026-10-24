'use client';
import {getCourseG04L04Vb005FrameState,CourseG04L04Vb005Renderer} from '../modules/course-g04-l04-vb-005';
import {createVocabularyChoicePresentation} from './g4-l4-vocabulary-choice';
import {G4_L4_VOCABULARY_CHOICE_CONFIGS} from './generated/g4-l4-vocabulary-choice-config';
export const G4_L4_VB005_TEXT_PRESENTATION=createVocabularyChoicePresentation(G4_L4_VOCABULARY_CHOICE_CONFIGS[0],getCourseG04L04Vb005FrameState,CourseG04L04Vb005Renderer);
