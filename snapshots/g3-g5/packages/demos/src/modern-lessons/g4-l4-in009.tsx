'use client';
import {CourseG04L04In009Renderer,getCourseG04L04In009FrameState} from '../modules/course-g04-l04-in-009';
import {createArithmeticChoicePresentation} from './g4-l4-arithmetic-choice';
import {G4_L4_ARITHMETIC_CHOICE_CONFIGS} from './generated/g4-l4-arithmetic-choice-config';
export const G4_L4_IN009_TEXT_PRESENTATION=createArithmeticChoicePresentation(G4_L4_ARITHMETIC_CHOICE_CONFIGS[0],getCourseG04L04In009FrameState,CourseG04L04In009Renderer);
export const G4_L4_IN009_TEXT_BINDING=G4_L4_IN009_TEXT_PRESENTATION.binding;
