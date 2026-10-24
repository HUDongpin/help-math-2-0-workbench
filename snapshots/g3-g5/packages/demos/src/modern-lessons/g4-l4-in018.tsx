'use client';
import {CourseG04L04In018Renderer,getCourseG04L04In018FrameState} from '../modules/course-g04-l04-in-018';
import {createArithmeticChoicePresentation} from './g4-l4-arithmetic-choice';
import {G4_L4_ARITHMETIC_CHOICE_CONFIGS} from './generated/g4-l4-arithmetic-choice-config';
export const G4_L4_IN018_TEXT_PRESENTATION=createArithmeticChoicePresentation(G4_L4_ARITHMETIC_CHOICE_CONFIGS[2],getCourseG04L04In018FrameState,CourseG04L04In018Renderer);
export const G4_L4_IN018_TEXT_BINDING=G4_L4_IN018_TEXT_PRESENTATION.binding;
