import type {LessonTextPresentationCapability} from '../../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../../source-static-canvas-candidate';
import {In007Renderer} from './renderer';
import {BINDING,snapshot} from './binding';
import {IN007_AUDIO_HOST} from './audio-host';
export {In007Renderer,deliverKeyword} from './renderer';
export {requestIn007KeyTerm} from './renderer';
export {IN007_KEYTERM_BUTTONS} from './audio-host';
export {snapshot as getIn007Snapshot} from './binding';
/** Frame555 is modern presentation hold; source timeline has no authored stop. */
export const IN007_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:BINDING,Renderer:In007Renderer,getSnapshot:snapshot,...IN007_AUDIO_HOST};
