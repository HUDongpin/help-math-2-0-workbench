/** Bounded plain-data source observations. Never invokes an ActionScript getter,
 * hit test, script, source control or renderer. Call snapshot only after a real
 * successful render; object presence/visibility is not pixel/content proof. */
import type {Runtime, DisplayObject} from './display';
import {technicalObjectId, type TechnicalOwner} from '../technical-observation-v1';

export const HFR_SOURCE_POINTER_LIMIT=32;
const OBJECT_LIMIT=64, VISIT_LIMIT=2048, SCRIPT_LIMIT=16, MISSING_LIMIT=128;
const HOST_LOG_LIMIT=5000, HOST_KIND_LIMIT=64, HOST_ARGS_LIMIT=16, HOST_LATEST_LIMIT=16;
type Primitive=string|number|boolean|null;
type PrimitiveRead={readonly status:string;readonly value:Primitive;readonly holderId?:string};
export interface SourceActionTrace {count:number;scripts:string[];overflow:number}
export interface SourcePointerOutcome {
 readonly phase:'press'|'release'|'cancel';readonly animationId:string;readonly sourceSha256:string;
 readonly tickBefore:number;readonly tickAfter:number;readonly point:readonly number[];
 readonly target:Readonly<Record<string,unknown>>|null;readonly inside:boolean|null;readonly hitTestPerformed:boolean;
 readonly releaseBranchExecuted:boolean;readonly releaseOutsideBranchExecuted:boolean;
 readonly sourceActionAttempts:number;readonly sourceActionScripts:readonly string[];readonly scriptOverflow:number;
 readonly eventHandlerAttempted:boolean;readonly errorsBefore:number;readonly errorsAfter:number;
}
export interface OwnedSourcePointer extends SourcePointerOutcome {
 readonly owner:TechnicalOwner;readonly observedAtMs:number;readonly dom:Readonly<Record<string,unknown>>;
}
/** Explicit existing-observer opt-in for this exact page/source. Default off. */
export function sourceObservationRequested(identity:TechnicalOwner|null):boolean {
 if(!identity||typeof window==='undefined')return false;
 const observer=(window as unknown as {__g678TechnicalObserver?:{sourceStateProfile?:string;boundPage?:{animationId?:string;sourceSha256?:string}}}).__g678TechnicalObserver;
 return observer?.sourceStateProfile==='controls-v1'&&observer.boundPage?.animationId===identity.animationId&&observer.boundPage.sourceSha256===identity.sourceSha256;
}
const relevantName=/^(?:NMH(?:Btn)?|AnsBtn[0-9]*|Mc_Popup|Mc_Ani|Mc_(?:Wrong|Right)_Feed[0-9]+|Mc_Feed_Popup|BtnClose|Src_[0-9]+|Tar_[0-9]+|HitField_mc|Mc_txt1|Coach_audio_[12]|Mc_Play|Mc_Inter|Mc_Feed2|Mc_Rect|txtFeed)$/i;
const popupName=/^(?:Mc_Popup|Mc_(?:Wrong|Right)_Feed[0-9]+|Mc_Feed_Popup)$/i;
function freeze<T>(value:T):T {
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){for(const child of Object.values(value))freeze(child);Object.freeze(value);}return value;
}
function string(value:unknown,max=128):string|null {return typeof value==='string'&&value.length<=max?value:null;}
const dataValue=(value:unknown,key:string):unknown=>{if(!value||typeof value!=='object')return undefined;const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')?d.value:undefined;};
const finiteValue=(value:unknown):number|null=>typeof value==='number'&&Number.isFinite(value)?value:null;
function localTransform(object:DisplayObject) {
 const matrix=dataValue(object,'m'),values=['a','b','c','d','tx','ty'].map(k=>finiteValue(dataValue(matrix,k))),moved=dataValue(object,'scriptMoved');
 return{values,complete:values.every(v=>v!==null)&&typeof moved==='boolean',order:'a,b,c,d,tx,ty',translationUnits:'twips; divide tx/ty by20 for source _x/_y',scriptMoved:typeof moved==='boolean'?moved:null};
}
function storedOpacity(object:DisplayObject):number|null {
 const seen=new Set<object>();let value=1,current:DisplayObject|null=object;
 for(let depth=0;current&&depth<128;depth++,current=current.parentClip){if(seen.has(current))return null;seen.add(current);const alpha=finiteValue(dataValue(dataValue(current,'cx'),'3'));if(alpha===null)return null;value*=alpha/256;if(!Number.isFinite(value))return null;}
 return current?null:value;
}
function sourceInteraction(runtime:Runtime) {
 const ref=(value:unknown)=>value===null?null:value&&typeof value==='object'&&dataValue(value,'isDisplay')===true?technicalObjectId(value,'source-object'):undefined;
 const mouse=dataValue(runtime,'mouse'),drag=dataValue(runtime,'drag'),pressed=ref(dataValue(runtime,'pressed')),hover=ref(dataValue(runtime,'hover')),dragObject=drag===null?null:ref(dataValue(drag,'clip'));
 const point=[finiteValue(dataValue(mouse,'x')),finiteValue(dataValue(mouse,'y'))],down=dataValue(mouse,'down'),dropTarget=string(dataValue(runtime,'dropTarget'),512);
 return{point,pointUnits:'source stage pixels',down:typeof down==='boolean'?down:null,pressedObjectId:pressed??null,hoverObjectId:hover??null,dragObjectId:dragObject??null,dropTarget,
  complete:point.every(v=>v!==null)&&typeof down==='boolean'&&pressed!==undefined&&hover!==undefined&&dragObject!==undefined&&dropTarget!==null,
  scope:'stored Runtime mouse/pressed/hover/drag/dropTarget only; no additional hit test or drop-target lookup'};
}
/** Existing Runtime.hostLog only. Data descriptors avoid invoking stored JS
 * accessors; AS values are never traversed or coerced. Counts cover retained
 * valid rows. At the Runtime cap, a complete total is unknowable. */
function hostCalls(runtime:Runtime) {
 const own=(value:object,key:string)=>{const d=Object.getOwnPropertyDescriptor(value,key);return d&&Object.hasOwn(d,'value')?d:null;};
 const log=own(runtime,'hostLog')?.value,available=Array.isArray(log),length=available?own(log,'length')?.value:null;
 const readable=available&&Number.isSafeInteger(length)&&length>=0,visited=readable?Math.min(length,HOST_LOG_LIMIT):0;
 const counts=new Map<string,number>(),latest:{index:number;tick:number;kind:string}[]=[];let unknownRows=0,kindOverflowRows=0,countedRows=0,previousTick=-1;
 for(let index=0;index<visited;index++) {
  const row=own(log,String(index))?.value,rowLength=Array.isArray(row)?own(row,'length')?.value:null;
  if(!Number.isSafeInteger(rowLength)||rowLength<2||rowLength>HOST_ARGS_LIMIT+2){unknownRows++;continue;}
  const tick=own(row,'0')?.value,kind=string(own(row,'1')?.value);let valid=Number.isSafeInteger(tick)&&tick>=previousTick&&tick>=0&&tick<=runtime.tickCount&&kind!==null&&kind.length>0;
  for(let i=2;valid&&i<rowLength;i++){const item=own(row,String(i)),v=item?.value;valid=!!item&&(v===undefined||v===null||typeof v==='boolean'||typeof v==='number'&&Number.isFinite(v)||typeof v==='string'&&v.length<=512);}
  if(!valid||kind===null){unknownRows++;continue;}previousTick=tick;
  if(!counts.has(kind)&&counts.size===HOST_KIND_LIMIT){kindOverflowRows++;continue;}
  counts.set(kind,(counts.get(kind)??0)+1);countedRows++;latest.push({index,tick,kind});if(latest.length>HOST_LATEST_LIMIT)latest.shift();
 }
 const capReached=readable&&length>=HOST_LOG_LIMIT,unreadRows=readable?Math.max(0,length-visited):null;
 const inventoryComplete=readable&&!capReached&&unknownRows===0&&kindOverflowRows===0&&unreadRows===0;
 return {observedFrom:'runtime-host-log',status:!readable?'unavailable':inventoryComplete?'observed':'incomplete',inventoryComplete,totalCalls:inventoryComplete?length:null,
  retainedRows:readable?length:null,visitedRows:visited,countedRows,unknownRows,kindOverflowRows,unreadRows,capReached,
  logLimit:HOST_LOG_LIMIT,kindLimit:HOST_KIND_LIMIT,argumentLimit:HOST_ARGS_LIMIT,latestLimit:HOST_LATEST_LIMIT,
  counts:[...counts].map(([kind,count])=>({kind,count})),latest,
  scope:'existing Runtime.hostLog through this source tick, which may include entry history before the current lease; incomplete counts are lower bounds; latest rows are valid counted rows only; arguments are validated but not retained; no per-action attribution or host callback/source effect replayed'};
}
/** Read stored AS data slots only. Calling ASObject.get would execute getters. */
function primitive(object:DisplayObject|Runtime['Global'],name:string):PrimitiveRead {
 const key=object.rt.ci?name.toLowerCase():name;let current:typeof object|null=object;const seen=new Set<object>();
 for(let depth=0;current&&depth<100;depth++,current=current.proto as typeof object|null){
  if(seen.has(current))return {status:'prototype-cycle',value:null};seen.add(current);
  const entry=current.props.get(key);if(!entry)continue;
  if(entry.getter)return {status:'accessor-not-invoked',value:null};
  const value=entry.v;if(value===undefined)return {status:'stored-undefined',value:null};
  if(value===null||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value)||typeof value==='string'&&value.length<=512)
   return {status:'stored-primitive',value,holderId:technicalObjectId(current,'source-object')};
  return {status:'nonprimitive-or-unbounded',value:null};
 }
 return {status:current?'prototype-limit':'absent',value:null};
}
function ancestorVisibility(object:DisplayObject):boolean|null {
 const seen=new Set<object>();let current:DisplayObject|null=object;
 for(let depth=0;current&&depth<128;depth++,current=current.parentClip){if(seen.has(current))return null;seen.add(current);if(!current.visible||current.removed)return false;}
 return current?null:true;
}
/** Captured at the already computed target, before its source release runs. */
export function sourceObjectFacts(object:DisplayObject|null):Readonly<Record<string,unknown>>|null {
 if(!object)return null;
 return freeze({objectId:technicalObjectId(object,'source-object'),name:string(object.name),nameComplete:typeof object.name==='string'&&object.name.length<=128,
  characterId:object.charId,depth:object.depth,parentId:object.parentClip?technicalObjectId(object.parentClip,'source-object'):null,
  kind:object.isClip?'movieclip':object.isButton?'button':object.isText?'text':'display',
  frame:object.isClip?(object as unknown as {frame:number}).frame:null,playing:object.isClip?(object as unknown as {playing:boolean}).playing:null,
  visible:object.visible,removed:object.removed,ancestorsVisible:ancestorVisibility(object),storedOpacity:storedOpacity(object),enabled:primitive(object,'enabled'),localTransform:localTransform(object),
  textValue:object.isText?string(dataValue(object,'textValue'),512):null,textValueComplete:!object.isText||string(dataValue(object,'textValue'),512)!==null,
  localVariables:Object.fromEntries(['oX','oY','tempMcName','tempMcName1','tempMcName2','tempInt','tempLabel','tempCount','splTemp','Mc_Wrong_Feed4'].map(name=>[name,primitive(object,name)]))});
}
export function sourceActionTrace():SourceActionTrace {return{count:0,scripts:[],overflow:0};}
export function recordSourceAction(trace:SourceActionTrace|undefined,script:string):void {
 if(!trace)return;trace.count++;if(trace.scripts.length<SCRIPT_LIMIT&&typeof script==='string'&&script.length<=128)trace.scripts.push(script);else trace.overflow++;
}
export function sourcePointerOutcome(runtime:Runtime,phase:SourcePointerOutcome['phase'],target:Readonly<Record<string,unknown>>|null,
 tickBefore:number,errorsBefore:number,inside:boolean|null,trace:SourceActionTrace,eventHandlerAttempted:boolean,
 point:readonly number[]=[runtime.mouse.x,runtime.mouse.y],hitTestPerformed=false):SourcePointerOutcome {
 return freeze({phase,animationId:runtime.page.placement.animationId,sourceSha256:runtime.page.source.sha256,tickBefore,tickAfter:runtime.tickCount,
  point:[...point],target,inside,hitTestPerformed,releaseBranchExecuted:phase==='release'&&inside===true,
  releaseOutsideBranchExecuted:phase==='release'&&inside===false,sourceActionAttempts:trace.count,sourceActionScripts:[...trace.scripts],scriptOverflow:trace.overflow,
  eventHandlerAttempted,errorsBefore,errorsAfter:runtime.errors.length});
}
export function ownSourcePointer(identity:TechnicalOwner,event:PointerEvent,outcome:SourcePointerOutcome):OwnedSourcePointer|null {
 if(identity.ownerKind!=='source-vm'||identity.animationId!==outcome.animationId||identity.sourceSha256!==outcome.sourceSha256)return null;
 return freeze({...outcome,owner:{...identity},observedAtMs:performance.now(),dom:{type:event.type,trusted:event.isTrusted,pointerId:event.pointerId,
  timeStamp:event.timeStamp,clientX:event.clientX,clientY:event.clientY,sourceHitRecomputed:false,sourceActionsReplayed:false}});
}
/** No mutable Runtime/DisplayObject/AS value is returned. Limits remain explicit. */
export function snapshotHfrSource(runtime:Runtime,identity:TechnicalOwner,pointers:readonly OwnedSourcePointer[],pointerOverflow:number):Readonly<Record<string,unknown>> {
 if(identity.ownerKind!=='source-vm'||runtime.page.placement.animationId!==identity.animationId||runtime.page.source.sha256!==identity.sourceSha256)
  return freeze({kind:'hfr-committed-source-observation-v1',status:'owner-source-mismatch',objects:[],pointerEvents:[],inventoryComplete:false});
 const targetIds=new Set(pointers.filter(p=>p.owner.playerId===identity.playerId&&p.owner.leaseToken===identity.leaseToken).map(p=>p.target?.objectId));
 const pending:{object:DisplayObject;popup:boolean}[]=[{object:runtime.page_,popup:false}],seen=new Set<DisplayObject>(),objects:Readonly<Record<string,unknown>>[]=[];let visits=0,objectOverflow=0,queueOverflow=0;
 while(pending.length&&visits<VISIT_LIMIT){const next=pending.pop()!,object=next.object,inPopup=next.popup||popupName.test(object.name);if(seen.has(object))continue;seen.add(object);visits++;
  if((object.isClip||object.isButton||relevantName.test(object.name))&&(object===runtime.page_||object.parentClip===runtime.page_&&object.isClip||object.isButton||relevantName.test(object.name)||inPopup||targetIds.has(technicalObjectId(object,'source-object')))){if(objects.length<OBJECT_LIMIT)objects.push(sourceObjectFacts(object)!);else objectOverflow++;}
  const room=VISIT_LIMIT-visits-pending.length;
  if(object.isClip){const children=(object as unknown as {children:Map<number,DisplayObject>}).children,ordered:DisplayObject[]=[];for(const child of children.values()){if(ordered.length===room)break;ordered.push(child);}queueOverflow+=children.size-ordered.length;ordered.sort((a,b)=>a.depth-b.depth);for(let i=ordered.length-1;i>=0;i--)pending.push({object:ordered[i],popup:inPopup});}
  else if(object.isButton){const children=(object as unknown as {stateChildren:DisplayObject[]}).stateChildren,count=Math.min(room,children.length);queueOverflow+=children.length-count;for(let i=count-1;i>=0;i--)pending.push({object:children[i],popup:inPopup});}
 }
 const missingCounts:{kind:string;key:string|null;count:number|null}[]=[];let missingOverflow=0,missingUnknownCount=0;
 for(const [kind,items]of Object.entries(runtime.missing)){let read=0;for(const [key,count]of items){if(missingCounts.length===MISSING_LIMIT){missingOverflow+=items.size-read;break;}const observedKey=string(key,256),observedCount=Number.isSafeInteger(count)&&count>=0?count:null;if(observedKey===null||observedCount===null)missingUnknownCount++;missingCounts.push({kind,key:observedKey,count:observedCount});read++;}}
 const owned=pointers.filter(p=>p.owner.playerId===identity.playerId&&p.owner.leaseToken===identity.leaseToken&&p.owner.replay===identity.replay&&p.animationId===identity.animationId&&p.sourceSha256===identity.sourceSha256),observedHostCalls=hostCalls(runtime),interaction=sourceInteraction(runtime);
 const currentStateComplete=observedHostCalls.inventoryComplete&&interaction.complete&&objectOverflow===0&&pending.length===0&&queueOverflow===0&&missingOverflow===0&&missingUnknownCount===0&&objects.every(o=>o.nameComplete===true&&o.storedOpacity!==null&&o.textValueComplete===true&&(o.localTransform as {complete:boolean}).complete);
 const droppedPointers=pointerOverflow+Math.max(0,owned.length-HFR_SOURCE_POINTER_LIMIT),pointerWindowComplete=Number.isSafeInteger(pointerOverflow)&&pointerOverflow>=0&&owned.length<=HFR_SOURCE_POINTER_LIMIT&&owned.every(p=>p.scriptOverflow===0);
 const pointerHistoryComplete=pointerWindowComplete&&droppedPointers===0;
 return freeze({kind:'hfr-committed-source-observation-v1',status:'observed',identity:{...identity},sourceTick:runtime.tickCount,rootFrame:runtime.page_.frame,pageRootObjectId:technicalObjectId(runtime.page_,'source-object'),
  objects,objectScope:'page root/main, actual buttons, source-named NMH/answer/popup/feedback/drag-target/coach controls, popup descendants and actual pointer targets; stored local transforms/slots, not whole object graph, rendered display-list or text content',
  objectLimit:OBJECT_LIMIT,visited:visits,visitLimit:VISIT_LIMIT,objectOverflow,queueOverflow,traversalIncomplete:pending.length>0||queueOverflow>0,
  globals:Object.fromEntries(['WrongFeed','quizTryCount','quizSection','quizDragCount','drag','KeyAttribute'].map(name=>[name,primitive(runtime.Global,name)])),
  hostCalls:observedHostCalls,interaction,
  missingCounts,missingOverflow,missingUnknownCount,missingReceiverPaths:null,pointerEvents:owned.slice(-HFR_SOURCE_POINTER_LIMIT),pointerOverflow:pointerOverflow+Math.max(0,owned.length-HFR_SOURCE_POINTER_LIMIT),
  pointerSupport:'owned HfrPlayer Canvas pointer handlers only; keyboard source adapters and semantic buttons are not inferred',
  inventoryComplete:currentStateComplete&&pointerHistoryComplete,
  stateInventoryComplete:currentStateComplete,pointerWindowComplete,pointerHistoryComplete,
  pointerWindow:{capacity:HFR_SOURCE_POINTER_LIMIT,retained:Math.min(owned.length,HFR_SOURCE_POINTER_LIMIT),dropped:droppedPointers,total:owned.length+pointerOverflow,scope:'current bounded window only; older discarded actions require their own retained action evidence'},
  sourceActionsInvoked:false,sourceGettersInvoked:false,hitTestsInvoked:false,pixelsProven:false});
}
