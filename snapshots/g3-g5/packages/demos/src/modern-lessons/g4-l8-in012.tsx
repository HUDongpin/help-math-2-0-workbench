'use client';
import {CourseG04L08In012Renderer,getCourseG04L08In012FrameState} from '../modules/course-g04-l08-in-012';
import {createOrderOperationsPresentation} from './g4-l8-order-operations';
import {G4_L8_ORDER_OPERATIONS_CONFIGS} from './generated/g4-l8-order-operations-config';
export const G4_L8_IN012_TEXT_PRESENTATION=createOrderOperationsPresentation(G4_L8_ORDER_OPERATIONS_CONFIGS[2],getCourseG04L08In012FrameState,CourseG04L08In012Renderer);
export const G4_L8_IN012_TEXT_BINDING=G4_L8_IN012_TEXT_PRESENTATION.binding;
