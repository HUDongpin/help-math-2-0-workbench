'use client';
import {CourseG04L04In005Renderer,getCourseG04L04In005FrameState} from '../modules/course-g04-l04-in-005';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_PLACE_VALUE_CONFIGS} from './generated/g4-l4-place-value-config';
export const G4_L4_IN005_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_PLACE_VALUE_CONFIGS[0],getCourseG04L04In005FrameState,CourseG04L04In005Renderer);
export const G4_L4_IN005_TEXT_BINDING=G4_L4_IN005_TEXT_PRESENTATION.binding;
