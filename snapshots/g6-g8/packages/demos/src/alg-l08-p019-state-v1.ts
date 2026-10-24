import{ALG_L08_P019_SOURCE as S}from'./alg-l08-p019-source-v1';export{ALG_L08_P019_SOURCE}from'./alg-l08-p019-source-v1';
export type P019Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p019Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>576)throw Error('invalid-p019-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P019State{mainFrame:number;cycle:number;replay:number;glossary:P019Term|null;}
export const p019InitialState=():P019State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
