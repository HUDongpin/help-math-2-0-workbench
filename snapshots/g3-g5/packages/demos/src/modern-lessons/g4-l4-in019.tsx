'use client';
import {CourseG04L04In019Renderer,getCourseG04L04In019FrameState} from '../modules/course-g04-l04-in-019';
import {createArithmeticChoicePresentation} from './g4-l4-arithmetic-choice';
import {G4_L4_ARITHMETIC_CHOICE_CONFIGS} from './generated/g4-l4-arithmetic-choice-config';
export const G4_L4_IN019_TEXT_PRESENTATION=createArithmeticChoicePresentation(G4_L4_ARITHMETIC_CHOICE_CONFIGS[3],getCourseG04L04In019FrameState,CourseG04L04In019Renderer);
export const G4_L4_IN019_TEXT_BINDING=G4_L4_IN019_TEXT_PRESENTATION.binding;
