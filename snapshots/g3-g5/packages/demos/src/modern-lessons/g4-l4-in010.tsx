'use client';
import {CourseG04L04In010Renderer,getCourseG04L04In010FrameState} from '../modules/course-g04-l04-in-010';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_PLACE_VALUE_CONFIGS} from './generated/g4-l4-place-value-config';
export const G4_L4_IN010_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_PLACE_VALUE_CONFIGS[1],getCourseG04L04In010FrameState,CourseG04L04In010Renderer);
export const G4_L4_IN010_TEXT_BINDING=G4_L4_IN010_TEXT_PRESENTATION.binding;
