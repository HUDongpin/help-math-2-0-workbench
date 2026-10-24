'use client';
import {CourseG04L04Rw003Renderer,getCourseG04L04Rw003FrameState} from '../modules/course-g04-l04-rw-003';
import {createLunchBillsPresentation} from './g4-l4-lunch-bills';
import {G4_L4_LUNCH_BILLS_CONFIG} from './generated/g4-l4-lunch-bills-config';
export const G4_L4_RW003_TEXT_PRESENTATION=createLunchBillsPresentation(G4_L4_LUNCH_BILLS_CONFIG,getCourseG04L04Rw003FrameState,CourseG04L04Rw003Renderer);
export const G4_L4_RW003_TEXT_BINDING=G4_L4_RW003_TEXT_PRESENTATION.binding;
