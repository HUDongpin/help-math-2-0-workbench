import{ALG_L07_P032_SOURCE as S}from'./alg-l07-p032-source-v1';export{ALG_L07_P032_SOURCE}from'./alg-l07-p032-source-v1';
export type P032Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p032Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>S.mainFrameCount)throw Error('invalid-p032-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P032State{mainFrame:number;cycle:number;replay:number;glossary:P032Term|null;}
export const p032InitialState=():P032State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
