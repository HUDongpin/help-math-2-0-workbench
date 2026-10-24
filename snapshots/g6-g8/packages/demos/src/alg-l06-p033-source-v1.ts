import model from '../../../migrations/shared-alg001-l06-p033/native-v1/source-model-v1.json';
export const P033_SOURCE_SHA256='fb11fd842f3f0948cf5b00bf3b7b63bde86f0af9bf41bb2f9e3a762a1daad071';
const texts:Readonly<Record<string,{text:string}>>=model.texts;
export function p033SourceState(frame:number,reducedMotion=false){
 if(!Number.isSafeInteger(frame)||frame<1||frame>385)throw Error('P033_SOURCE_FRAME_RANGE');
 const shown=(id:number)=>model.mainNativeInstances.some(i=>i.objectId===id&&i.runs.some(r=>frame>=r.firstFrame&&frame<=r.lastFrame&&r.color.factor.Alpha+r.color.offset.Alpha>0));
 const emphasis=([186,187,188,189] as const).find((id,index)=>reducedMotion?
  frame>=257+index*6&&frame<=261+index*6:shown(id));
 return {frame,question:texts['5'].text,options:model.answerPlacements.filter(a=>shown(a.textId)),
  explanation:[178,184].filter(shown).map(textId=>({textId,text:texts[String(textId)].text})),
  emphasizedPair:emphasis===undefined?null:emphasis-186,glossary:model.glossary.filter(g=>frame>=g.firstFrame&&frame<=g.lastFrame),
  sourceSha256:P033_SOURCE_SHA256};
}
