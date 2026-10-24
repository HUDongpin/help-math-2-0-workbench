'use client';
import type {LessonTextActivityDefinition,LessonTextPresentationCapability} from '../lesson-text-contract';
import type {SourceStaticCanvasFrameState} from '../source-static-canvas-candidate';
import {G4_L4_IN004_CAPABILITY_CONFIG as C} from './generated/g4-l4-in004-capability-config';
import {IN004_FEEDBACK_TIMELINES,IN004_FRAME_CONTROL} from './g4-l4-in004-host-state';
import {IN004_BINDING,getIn004TextSnapshot} from './g4-l4-in004-text';
import {In004Page} from './g4-l4-in004-page';
const audio:Readonly<Record<string,readonly NonNullable<LessonTextActivityDefinition['audio']>[]>>=C.audio;
export const IN004_ACTIVITIES:readonly LessonTextActivityDefinition[]=[
 ...IN004_FEEDBACK_TIMELINES.map(d=>({...d,audio:audio[d.frameDomain.slice(7)].find(a=>a.firstFrame===d.startFrame)!})),
 {id:'in004-g4l4-close-down',sourceInstanceId:C.closeInstance,frameDomain:'sprite-85',parentLifetime:{firstFrame:474,lastFrameExclusive:483},parentFrames:[474,475,476,477,478,479,480,481,482],startFrame:1,endFrame:5,fps:12,buttonPress:{sourceButtonId:86},audio:audio['85'][0]},
];
export const G4_L4_IN004_TEXT_PRESENTATION:LessonTextPresentationCapability<SourceStaticCanvasFrameState>={schemaVersion:1,binding:IN004_BINDING,Renderer:In004Page,getSnapshot:getIn004TextSnapshot,playbackMode:'once',playbackEndFrameByDomain:{'sprite-207':470},reducedMotionFrameByDomain:{'sprite-207':470},frameControl:IN004_FRAME_CONTROL,activityTimelines:IN004_ACTIVITIES,sourceTimelineAudioCues:[C.sourceAudio],keyTerms:C.keyTerms};
