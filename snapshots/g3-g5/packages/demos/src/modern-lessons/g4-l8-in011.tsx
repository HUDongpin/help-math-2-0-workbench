'use client';
import {CourseG04L08In011Renderer,getCourseG04L08In011FrameState} from '../modules/course-g04-l08-in-011';
import {createOrderOperationsPresentation} from './g4-l8-order-operations';
import {G4_L8_ORDER_OPERATIONS_CONFIGS} from './generated/g4-l8-order-operations-config';
export const G4_L8_IN011_TEXT_PRESENTATION=createOrderOperationsPresentation(G4_L8_ORDER_OPERATIONS_CONFIGS[1],getCourseG04L08In011FrameState,CourseG04L08In011Renderer);
export const G4_L8_IN011_TEXT_BINDING=G4_L8_IN011_TEXT_PRESENTATION.binding;
