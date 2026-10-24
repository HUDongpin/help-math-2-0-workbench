'use client';
import {CourseG04L04Ts006Renderer,getCourseG04L04Ts006FrameState} from '../modules/course-g04-l04-ts-006';
import {createFourStepPlanPresentation} from './g4-l4-four-step-plan';
import {G4_L4_FOUR_STEP_CONFIGS} from './generated/g4-l4-four-step-native-config';
const base=createFourStepPlanPresentation(G4_L4_FOUR_STEP_CONFIGS[2],getCourseG04L04Ts006FrameState,CourseG04L04Ts006Renderer);
const cue=base.sourceTimelineAudioCues?.[0];
if(base.sourceTimelineAudioCues?.length!==1||!cue||cue.id!=='source-main'||cue.frameDomain!=='sprite-23'||cue.frame!==1||cue.endFrame!==126||cue.sha256!=='ae787731abc9013b3aad4e87275ffa59dc76c760c34ca2f0fefc3073344d355d')throw Error('TS006 exact source audio cue is unavailable');
export const G4_L4_TS006_TEXT_PRESENTATION={...base,terminalTimelineAudio:{frameDomain:'sprite-23',holdFrame:125,endFrameExclusive:126,cueId:cue.id,sourceSha256:cue.sha256,pcmSha256:'353ea647a44968acc8d4b1f601cc44c3379a085dc523899d1908a2839c70fd87',allowClockDriftTail:true as const}};
export const G4_L4_TS006_TEXT_BINDING=G4_L4_TS006_TEXT_PRESENTATION.binding;
