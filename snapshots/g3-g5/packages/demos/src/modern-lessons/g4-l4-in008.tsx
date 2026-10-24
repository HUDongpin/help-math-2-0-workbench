'use client';
import {getCourseG04L04In008FrameState} from '../modules/course-g04-l04-in-008';
import {createLunchAdditionPresentation} from './g4-l4-lunch-addition';
import {G4_L4_LUNCH_ADDITION_CONFIG} from './generated/g4-l4-lunch-addition-config';
export const G4_L4_IN008_TEXT_PRESENTATION=createLunchAdditionPresentation(G4_L4_LUNCH_ADDITION_CONFIG,getCourseG04L04In008FrameState);
