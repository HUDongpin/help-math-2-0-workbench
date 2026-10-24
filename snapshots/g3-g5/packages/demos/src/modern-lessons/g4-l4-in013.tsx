'use client';
import {CourseG04L04In013Renderer,getCourseG04L04In013FrameState} from '../modules/course-g04-l04-in-013';
import {createArithmeticChoicePresentation} from './g4-l4-arithmetic-choice';
import {G4_L4_ARITHMETIC_CHOICE_CONFIGS} from './generated/g4-l4-arithmetic-choice-config';
export const G4_L4_IN013_TEXT_PRESENTATION=createArithmeticChoicePresentation(G4_L4_ARITHMETIC_CHOICE_CONFIGS[1],getCourseG04L04In013FrameState,CourseG04L04In013Renderer);
export const G4_L4_IN013_TEXT_BINDING=G4_L4_IN013_TEXT_PRESENTATION.binding;
