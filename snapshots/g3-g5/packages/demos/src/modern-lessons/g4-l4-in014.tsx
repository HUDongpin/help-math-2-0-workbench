'use client';
import {CourseG04L04In014Renderer,getCourseG04L04In014FrameState} from '../modules/course-g04-l04-in-014';
import {createColumnArithmeticPresentation} from './g4-l4-column-arithmetic';
import {G4_L4_PLACE_VALUE_CONFIGS} from './generated/g4-l4-place-value-config';
export const G4_L4_IN014_TEXT_PRESENTATION=createColumnArithmeticPresentation(G4_L4_PLACE_VALUE_CONFIGS[2],getCourseG04L04In014FrameState,CourseG04L04In014Renderer);
export const G4_L4_IN014_TEXT_BINDING=G4_L4_IN014_TEXT_PRESENTATION.binding;
