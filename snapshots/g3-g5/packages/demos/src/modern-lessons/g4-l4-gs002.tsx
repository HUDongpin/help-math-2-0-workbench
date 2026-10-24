'use client';
import type {LessonTextActivityDefinition, LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L4_ZOG_X_PAGE as C} from './generated/g4-l4-zog-x-page-config';
import {G4_L4_ZOG_X_GAME as game} from './generated/g4-l4-zog-x-game-config';
import {ZOG_X_GAME_CLOCKS, ZOG_X_GAME_FRAME_CONTROL} from './g4-l4-zog-x-host-state';
import {ZOG_X_BINDING, getZogXTextSnapshot} from './g4-l4-zog-x-text';
import {ZogXPage, loadZogXScene} from './g4-l4-zog-x-page';
const audio: Readonly<Record<string, NonNullable<LessonTextActivityDefinition['audio']>>> = C.audio;
export const ZOG_X_ACTIVITIES: readonly LessonTextActivityDefinition[] = [
  ...ZOG_X_GAME_CLOCKS.map(d => d.id === 'g4-l4-zog-x-wrong-close' ? d : {...d, audio: audio[d.frameDomain.slice(7)]}),
  ...C.closeActivities,
];
export const G4_L4_GS002_TEXT_PRESENTATION: LessonTextPresentationCapability<SourceStaticCanvasFrameState> = {
  schemaVersion: 1, binding: ZOG_X_BINDING, Renderer: ZogXPage, getSnapshot: getZogXTextSnapshot,
  playbackMode: 'once', playbackEndFrameByDomain: {[game.frameDomain]: game.readyFrame},
  reducedMotionFrameByDomain: {[game.frameDomain]: game.readyFrame}, frameControl: ZOG_X_GAME_FRAME_CONTROL,
  activityTimelines: ZOG_X_ACTIVITIES, sourceTimelineAudioCues: [C.sourceAudio], keyTerms: C.keyTerms,
  completion: {id: 'g4-l4-zog-x-complete', frameDomain: game.frameDomain, frames: [game.finalFrame]},
  prepare: async () => {await loadZogXScene();},
};
