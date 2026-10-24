import {NMS_L02_P025_IR as IR} from './generated/nms-l02-p025-source-ir-v1';
import type {P025FrameState} from './nms-l02-p025-timeline-v1';
import type {P025TeachingState} from './nms-l02-p025-source-contract-v1';
export type P025TermKey='Equivalent fraction'|'Fraction'|'Quantity';
/** Source-defined teaching state only: layout and host playback remain separate. */
export function p025TeachingState(state:P025FrameState):P025TeachingState&{readonly headingVisible:boolean;readonly termAvailable:Readonly<Record<P025TermKey,boolean>>} {
 const row: P025TeachingState=state.mainFrame===null?{definition:[],bars:[],fractions:[],equality:false}:IR.teachingStates[IR.teachingFrames[state.mainFrame-1]!]!;
 return Object.freeze({...row,headingVisible:state.nodes.some(n=>n.characterId===1&&n.color[3]+n.color[7]>0),termAvailable:Object.freeze({'Equivalent fraction':Boolean(row.definition[0]?.complete),Fraction:Boolean(row.definition[2]?.complete),Quantity:Boolean(row.definition[4]?.complete)})});
}
