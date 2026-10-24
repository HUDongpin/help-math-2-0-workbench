'use client';
import {COURSE_G04_L05_VB_015_RENDERER as Fallback, getCourseG04L05Vb015FrameState} from '../modules/course-g04-l05-vb-015';
import {createVb015Presentation} from './g4-l5-vb015/presentation';
import {VB015_SOURCE_AUDIO} from './g4-l5-vb015/audio.generated';
export const G4_L5_VB015_TEXT_PRESENTATION = createVb015Presentation(getCourseG04L05Vb015FrameState, Fallback, VB015_SOURCE_AUDIO);
export const G4_L5_VB015_TEXT_BINDING = G4_L5_VB015_TEXT_PRESENTATION.binding;
