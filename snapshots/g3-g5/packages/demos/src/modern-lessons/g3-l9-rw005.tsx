'use client';
import sourceModule from '../modules/course-g03-l09-rw-005';
import {G3_L9_RW_FAMILY} from './generated/g3-l9-rw-family-v1';
import {createG3L9RwModernLesson} from './g3-l9-rw-family';
export const G3_L9_RW005_TEXT_PRESENTATION = createG3L9RwModernLesson(G3_L9_RW_FAMILY[2], sourceModule.getFrameState);
export const binding = G3_L9_RW005_TEXT_PRESENTATION.binding;
export const ModernRenderer = G3_L9_RW005_TEXT_PRESENTATION.Renderer;
export const getSnapshot = G3_L9_RW005_TEXT_PRESENTATION.getSnapshot;
