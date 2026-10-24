import{ALG_L08_P011_SOURCE as S}from'./alg-l08-p011-source-v1';export{ALG_L08_P011_SOURCE}from'./alg-l08-p011-source-v1';
export type P011Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p011Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>288)throw Error('invalid-p011-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P011State{mainFrame:number;cycle:number;replay:number;glossary:P011Term|null;}
export const p011InitialState=():P011State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
