import{ALG_L08_P018_SOURCE as S}from'./alg-l08-p018-source-v1';export{ALG_L08_P018_SOURCE}from'./alg-l08-p018-source-v1';
export type P018Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p018Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>220)throw Error('invalid-p018-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P018State{mainFrame:number;cycle:number;replay:number;glossary:P018Term|null;}
export const p018InitialState=():P018State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
