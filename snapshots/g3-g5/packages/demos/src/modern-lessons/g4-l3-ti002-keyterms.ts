import type{AnimationRendererProps}from'../contract';
import source from'./generated/g4-l3-ti002-native-inputs.json';
export const TI002_KEY_TERMS={...source.keyTerms,indexLanguage:'en' as const};
/** One reviewed source correction: button81 and its frame23 successor125 use
 * the same hotspot. Preserve the missing Ordering entry in frozen source data;
 * use the successor's existing Order entry only for this exact source/action pair. */
function keyTermEntry(id:number){
 const button=source.keyTermButtons.find(b=>b.sourceButtonId===id);
 if(button?.entryId)return button.entryId;
 const successor=source.keyTermButtons.find(b=>b.sourceButtonId===125);
 return id===81&&source.sourceSwfSha256==='e640f8dcbfb6dd6945d97be67890e0015902702239e2bad4bd4283685fb0f807'&&
  button?.sourceTerm==='Ordering'&&button.actionTextSha256==='20421492af5810474e58f318e3c8e3d9a7a5a368c85e22053c00b6465a6b9f71'&&
  successor?.sourceTerm==='Order'&&successor.actionTextSha256==='2a3a85335b3a42e62e76732405e7e9a1bdb548fbfffc5b5fb0a0940913bc3e64'&&
  successor.entryId==='en-0438-85eefb739783'?successor.entryId:null;
}
/** Source placement/opacity still governs availability, including removal. */
export function ti002KeyTermAvailable(frame:number,id:number){
 if(!Number.isInteger(frame)||frame<1||frame>254||!keyTermEntry(id))return false;
 const depths=new Map<number,{characterId:number;alpha:number}>();
 for(const e of source.timelines.find(t=>t.timelineId==='sprite-272')!.events){
  if(e.frame>frame)break;
  if(e.kind==='remove'){depths.delete(e.depth!);continue;}
  if(e.kind!=='place')continue;
  const old=e.move?depths.get(e.depth!):undefined;
  const characterId=e.characterId??old?.characterId;
  if(characterId===undefined)throw Error('TI002 source glossary placement invalid');
  const color=e.colorTransform;
  depths.set(e.depth!,{characterId,alpha:color?(color.multiply?.[3]??256)/256+(color.add?.[3]??0)/255:old?.alpha??1});
 }
 return [...depths.values()].some(p=>p.characterId===id&&p.alpha>0);
}
export function requestTi002KeyTerm(runtime:AnimationRendererProps,sourceButtonId:number,trigger:HTMLButtonElement){
 if(!Number.isInteger(runtime.frame)||runtime.frame<1||runtime.frame>254||(runtime.frameDomain??'sprite-272')!=='sprite-272'||runtime.scenario!=='source-static-frame'||runtime.lang!=='en'||runtime.entryStateSha256||runtime.paused||!runtime.onLessonHostRequest)return false;
 if(!ti002KeyTermAvailable(runtime.frame,sourceButtonId))return false;
 const entryId=keyTermEntry(sourceButtonId);
 if(!entryId)return false;
 runtime.onLessonHostRequest({type:'open-keyterm',entryId,sourceAnimationId:'course-g04-l03-ti-002',playbackDisposition:'source-stop-timeline-and-audio-until-explicit-resume'},{trigger,keyTermIndexLanguage:'en'});
 return true;
}
export const TI002_DEFINITION_LINKS:Readonly<Record<number,readonly {text:string;button:number}[]>>={
 71:[{text:'less than',button:73},{text:'zero',button:74}],
 76:[{text:'value',button:77}],
 79:[{text:'line',button:80},{text:'ordering',button:125},{text:'value',button:77}],
 83:[{text:'greater than',button:85},{text:'zero',button:84}],
 87:[{text:'value',button:77},{text:'negative',button:88},{text:'positive',button:89}],
};
