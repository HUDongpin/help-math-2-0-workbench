import {getCourseG04L04Ti002FrameState,CourseG04L04Ti002Renderer} from '../modules/course-g04-l04-ti-002';
import {createKeyTermDragPresentation} from './g4-l4-key-term-drag';
import {G4_L4_KEY_TERM_DRAG_CONFIG} from './generated/g4-l4-key-term-drag-config';
export const G4_L4_TI002_TEXT_PRESENTATION=createKeyTermDragPresentation(G4_L4_KEY_TERM_DRAG_CONFIG,getCourseG04L04Ti002FrameState,CourseG04L04Ti002Renderer);
