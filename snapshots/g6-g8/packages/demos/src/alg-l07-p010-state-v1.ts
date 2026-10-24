import{ALG_L07_P010_SOURCE as S}from'./alg-l07-p010-source-v1';export{ALG_L07_P010_SOURCE}from'./alg-l07-p010-source-v1';
export type P010Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p010Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>263)throw Error('invalid-p010-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P010State{mainFrame:number;cycle:number;replay:number;glossary:P010Term|null;}
export const p010InitialState=():P010State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
