'use client';
import {getCourseG04L04Rw004FrameState} from '../modules/course-g04-l04-rw-004';
import {createLunchActivityPresentation} from './g4-l4-lunch-activity';
import {G4_L4_LUNCH_ACTIVITY_CONFIG} from './generated/g4-l4-lunch-activity-config';
export const G4_L4_RW004_TEXT_PRESENTATION = createLunchActivityPresentation(G4_L4_LUNCH_ACTIVITY_CONFIG, getCourseG04L04Rw004FrameState);
export const G4_L4_RW004_TEXT_BINDING = G4_L4_RW004_TEXT_PRESENTATION.binding;
