'use client';
import {getCourseG04L05Vb005FrameState,CourseG04L05Vb005Renderer} from '../modules/course-g04-l05-vb-005';
import {createVocabularyChoicePresentation} from './g4-l4-vocabulary-choice';
import {G4_L5_PRODUCT_CHOICE_CONFIGS} from './generated/g4-l5-product-choice-config';
export const G4_L5_VB005_TEXT_PRESENTATION=createVocabularyChoicePresentation(G4_L5_PRODUCT_CHOICE_CONFIGS[0],getCourseG04L05Vb005FrameState,CourseG04L05Vb005Renderer);
