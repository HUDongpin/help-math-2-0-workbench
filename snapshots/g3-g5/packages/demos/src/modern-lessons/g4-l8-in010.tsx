'use client';
import {CourseG04L08In010Renderer,getCourseG04L08In010FrameState} from '../modules/course-g04-l08-in-010';
import {createOrderOperationsPresentation} from './g4-l8-order-operations';
import {G4_L8_ORDER_OPERATIONS_CONFIGS} from './generated/g4-l8-order-operations-config';
export const G4_L8_IN010_TEXT_PRESENTATION=createOrderOperationsPresentation(G4_L8_ORDER_OPERATIONS_CONFIGS[0],getCourseG04L08In010FrameState,CourseG04L08In010Renderer);
export const G4_L8_IN010_TEXT_BINDING=G4_L8_IN010_TEXT_PRESENTATION.binding;
