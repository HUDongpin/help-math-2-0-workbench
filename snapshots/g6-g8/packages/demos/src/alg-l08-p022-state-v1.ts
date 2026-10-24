import{ALG_L08_P022_SOURCE as S}from'./alg-l08-p022-source-v1';export{ALG_L08_P022_SOURCE}from'./alg-l08-p022-source-v1';
export type P022Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p022Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>546)throw Error('invalid-p022-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P022State{mainFrame:number;cycle:number;replay:number;glossary:P022Term|null;}
export const p022InitialState=():P022State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
