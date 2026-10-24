import{ALG_L08_P016_SOURCE as S}from'./alg-l08-p016-source-v1';export{ALG_L08_P016_SOURCE}from'./alg-l08-p016-source-v1';
export type P016Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p016Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>575)throw Error('invalid-p016-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P016State{mainFrame:number;cycle:number;replay:number;glossary:P016Term|null;}
export const p016InitialState=():P016State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
