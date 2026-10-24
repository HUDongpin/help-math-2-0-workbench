import{ALG_L08_P015_SOURCE as S,type P015VisualState}from'./alg-l08-p015-source-v1';export{ALG_L08_P015_SOURCE}from'./alg-l08-p015-source-v1';
export type P015Term=typeof S.terms[number]['sourceKeyAttribute'];
export interface P015State{mainFrame:number;cycle:0;replay:number;glossary:P015Term|null;sliderX:number;intercept:number;dragged:boolean;}
export const p015InitialState=():P015State=>({mainFrame:1,cycle:0,replay:0,glossary:null,sliderX:30.5,intercept:0,dragged:false});
export function p015Visual(frame:number):P015VisualState{if(!Number.isSafeInteger(frame)||frame<1||frame>503)throw Error('invalid-p015-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;}
/** Source SWF6 treats the absent parent line baseline as numeric zero. Keep the
 * original initial placement until an actual drag; it is not the value0 result. */
export function p015LinePosition(state:P015State):readonly[number,number]{return state.dragged?[-Math.trunc(state.intercept*6.5)-26,-Math.trunc(state.intercept*6.4)-26]:[-49,-.85];}
export function p015SetSlider(state:P015State,x:number):P015State{if(state.mainFrame<500||state.glossary||!Number.isFinite(x))return state;const sliderX=Math.round(Math.max(-70,Math.min(130,x))*20)/20,intercept=Math.round(sliderX/10-3)||0;return{...state,sliderX,intercept,dragged:true};}
