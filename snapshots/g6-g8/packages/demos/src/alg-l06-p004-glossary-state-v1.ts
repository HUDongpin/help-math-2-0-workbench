/** Main-sprite source button occurrences, audited against shipped L6RW04.swf.
 * This is a bounded interaction model, not a registered renderer or AVM1 VM. */
import {P004_HIT_REGIONS} from './alg-l06-p004-hit-regions.generated';
export const P004_SOURCE_SHA256='514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e';
export const P004_GLOSSARY_BUTTONS=Object.freeze([
 {buttonId:57,keyAttribute:'Input',firstFrame:127},
 {buttonId:59,keyAttribute:'Output',firstFrame:195},
 {buttonId:79,keyAttribute:'Function',firstFrame:508},
 {buttonId:80,keyAttribute:'Relation',firstFrame:508},
 {buttonId:81,keyAttribute:'Value',firstFrame:508},
 {buttonId:84,keyAttribute:'Rule',firstFrame:614},
 {buttonId:85,keyAttribute:'Input',firstFrame:614},
 {buttonId:86,keyAttribute:'output',firstFrame:614},
] as const);
export type P004GlossaryState=Readonly<{frame:number;paused:boolean;
 selectedButton:number|null;keyAttribute:string|null}>;
function frame(value:number){if(!Number.isInteger(value)||value<1||value>831)
 throw Error('P004_FRAME_OUTSIDE_SOURCE_DOMAIN');return value;}
export function p004InitialGlossaryState():P004GlossaryState{
 return Object.freeze({frame:1,paused:true,selectedButton:null,keyAttribute:null});
}
export function p004VisibleGlossaryButtons(value:number){
 const current=frame(value);return P004_GLOSSARY_BUTTONS.filter(button=>current>=button.firstFrame);
}
/** Match exact authored KeyAttribute, including lower-case output on button86. */
export function p004ActivateGlossary(state:P004GlossaryState,buttonId:number):P004GlossaryState{
 const button=p004VisibleGlossaryButtons(state.frame).find(button=>button.buttonId===buttonId);
 if(!button)throw Error('P004_BUTTON_NOT_PRESENT_AT_SOURCE_FRAME');
 return Object.freeze({...state,paused:true,selectedButton:button.buttonId,keyAttribute:button.keyAttribute});
}
/** Modern close retains the pause; original shell resume behavior is unproven. */
export function p004CloseGlossary(state:P004GlossaryState):P004GlossaryState{
 frame(state.frame);return Object.freeze({frame:state.frame,paused:true,selectedButton:null,keyAttribute:null});
}
export function p004ReplayGlossary():P004GlossaryState{return p004InitialGlossaryState();}

/** Rendering must use occurrences: symbol79 has two simultaneous placements. */
export function p004VisibleGlossaryOccurrences(value:number){
 const current=frame(value);return P004_HIT_REGIONS.filter(row=>current>=row.firstFrame&&current<=row.lastFrame);
}
export function p004ActivateGlossaryOccurrence(state:P004GlossaryState,occurrenceId:string){
 const occurrence=p004VisibleGlossaryOccurrences(state.frame).find(row=>row.occurrenceId===occurrenceId);
 if(!occurrence)throw Error('P004_OCCURRENCE_NOT_PRESENT_AT_SOURCE_FRAME');
 return Object.freeze({...p004ActivateGlossary(state,occurrence.buttonId),selectedOccurrence:occurrenceId});
}
