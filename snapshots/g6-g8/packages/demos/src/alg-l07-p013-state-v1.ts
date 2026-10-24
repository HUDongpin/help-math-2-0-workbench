import{ALG_L07_P013_SOURCE as S}from'./alg-l07-p013-source-v1';export{ALG_L07_P013_SOURCE}from'./alg-l07-p013-source-v1';
export type P013Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p013Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>213)throw Error('invalid-p013-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P013State{mainFrame:number;cycle:number;replay:number;glossary:P013Term|null;}
export const p013InitialState=():P013State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
