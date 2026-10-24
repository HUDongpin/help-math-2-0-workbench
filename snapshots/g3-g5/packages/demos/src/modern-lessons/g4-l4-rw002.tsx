'use client';
import {getCourseG04L04Rw002FrameState} from '../modules/course-g04-l04-rw-002';
import {createLunchMenuPresentation} from './g4-l4-lunch-menu';
import {G4_L4_LUNCH_MENU_CONFIG} from './generated/g4-l4-lunch-menu-config';
export const G4_L4_RW002_TEXT_PRESENTATION=createLunchMenuPresentation(G4_L4_LUNCH_MENU_CONFIG,getCourseG04L04Rw002FrameState);
