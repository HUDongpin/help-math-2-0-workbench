import{ALG_L08_P021_SOURCE as S}from'./alg-l08-p021-source-v1';export{ALG_L08_P021_SOURCE}from'./alg-l08-p021-source-v1';
export type P021Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p021Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>797)throw Error('invalid-p021-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P021State{mainFrame:number;cycle:number;replay:number;glossary:P021Term|null;}
export const p021InitialState=():P021State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
