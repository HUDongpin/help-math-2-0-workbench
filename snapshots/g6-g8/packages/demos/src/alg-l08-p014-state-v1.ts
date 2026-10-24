import{ALG_L08_P014_SOURCE as S}from'./alg-l08-p014-source-v1';export{ALG_L08_P014_SOURCE}from'./alg-l08-p014-source-v1';
export type P014Term=typeof S.terms[number]['sourceKeyAttribute'];
export const p014Visual=(frame:number)=>{if(!Number.isSafeInteger(frame)||frame<1||frame>334)throw Error('invalid-p014-source-frame');return S.visualStates.find(s=>frame>=s.first&&frame<=s.last)!.value;};
export interface P014State{mainFrame:number;cycle:number;replay:number;glossary:P014Term|null;}
export const p014InitialState=():P014State=>({mainFrame:1,cycle:0,replay:0,glossary:null});
