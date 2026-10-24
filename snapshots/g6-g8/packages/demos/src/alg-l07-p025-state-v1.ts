import{ALG_L07_P025_SOURCE as S}from'./alg-l07-p025-source-v1';export{ALG_L07_P025_SOURCE}from'./alg-l07-p025-source-v1';
export type P025Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p025Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>S.mainFrameCount)throw Error('invalid-p025-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P025State{mainFrame:number;cycle:number;replay:number;glossary:P025Term|null;}
export const p025InitialState=():P025State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
