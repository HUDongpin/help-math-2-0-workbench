import {P004_SEMANTIC_PAIRS_V1,P004_PAIR_REPLACED_INSTANCE_IDS,p004SemanticPairs} from './alg-l06-p004-semantic-pairs-v1';
import {P004_EQUATION_STATES_V1,p004EquationRows,P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS,P004_EQUATION_EVIDENCE_V1,type P004EquationRowV1} from './alg-l06-p004-equation-presentation-v1';
import type {LessonTextBinding,LessonTextInstance,LessonTextRole} from './lesson-text-contract';
import {lessonTextInstanceId} from './lesson-text-snapshot';
import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
import {p004TextOccurrences,type P004TextOccurrence} from './alg-l06-p004-text-occurrences-v2';
/** Exact reviewed geometry decision, verified against its pinned JSON in tests.
 * Browser code carries no filesystem reader or private audit payload. */
export const P004_SEMANTIC_EQUATION=Object.freeze({
 auditPath:'migrations/shared-alg001-l06-p004/audit/equation-geometry-v1.json',
 auditSha256:'080019ad49d6d1513beaffd7bf5a234183deabdec5af144c9f048c142f2aeab2',
 instanceIds:Object.freeze(['sprite-95/depth-80/generation-5','sprite-95/depth-81/generation-2']),
 firstFrame:93,lastFrame:831,text:'M = $0.50 × C',
 interpretation:'source x in the audited scalar-to-variable gap is expressed as multiplication ×',
});
/** Full sentences become available when their source mask finishes its reveal.
 * This deliberately avoids synthesizing the progressive glyph animation. */
export const P004_SENTENCE_REVEAL_EVIDENCE=Object.freeze({
 path:'output/alg-l06-p004-composed-text-v1/visual-review-v1.json',
 sha256:'38e5f097bbd031b5a67d3eb0ec8c166530e0734f15706479d76b701e2b37577e',
});
export const P004_SENTENCE_REVEAL=Object.freeze({
 'sprite-95/depth-84/generation-3':611,
 'sprite-95/depth-94/generation-1':684,
} as const);
export const P004_SEMANTIC_TEXT_POLICY=Object.freeze({
 reveal:'source-mask-complete sentences at611/684; coherent rule1..831; worked314..461 with answer367; no original-runtime pixel assertion',
 order:'root title, then source instance creation frame/depth/generation; equation replaces its first constituent position',
 language:'en',translation:'none',initialEquation:'one coherent rule with phase-specific glyph and outlined-shape provenance',
 snapshotVisibilityComplete:false,nativeTypographyComplete:false,acceptanceEffect:'none',
});
function instance(row:P004TextOccurrence):LessonTextInstance{
 const leaf=Object.freeze({timelineId:row.timelineId,depth:row.depth,generation:row.generation,characterId:row.characterId});
 const path=Object.freeze(row.timelineId==='root'?[leaf]:[
  Object.freeze({timelineId:'root',depth:1,generation:1,characterId:95}),leaf]);
 return Object.freeze({id:lessonTextInstanceId(path),path});
}
function role(row:P004TextOccurrence):LessonTextRole{
 return row.characterId===96?'title':[78,83].includes(row.characterId)?'body':'label';
}
export type P004SemanticTextRow=Readonly<{
 id:string;kind:'source-text'|'semanticMath'|'semanticPair';text:string;role:LessonTextRole;language:'en';
 sourceTextIds:readonly string[];instanceIds:readonly string[];instances:readonly LessonTextInstance[];
 math:Readonly<{expression:string;operator:'multiplication';sourceOperator:'x';geometryAuditSha256:string;teachingDecisionSha256:string;ariaLabel:string}>|null;
 sourceShapeIds?:readonly number[];
 pair?:Readonly<{label:string;value:string;kind:'price'|'equation-variable'}>;
 revealPolicy:typeof P004_SEMANTIC_TEXT_POLICY.reveal;
}>;
function shapeInstance(shape:P004EquationRowV1['sourceShapeAnchors'][number]):LessonTextInstance{
 const match=/^sprite-95\/depth-(\d+)\/generation-(\d+)$/.exec(shape.instanceId);
 if(!match)throw Error('P004 equation shape instance identity invalid');
 const path=Object.freeze([
  Object.freeze({timelineId:'root',depth:1,generation:1,characterId:95}),
  Object.freeze({timelineId:'sprite-95',depth:Number(match[1]),generation:Number(match[2]),characterId:shape.characterId})]);
 return Object.freeze({id:lessonTextInstanceId(path),path});
}
function equationRow(row:P004EquationRowV1):P004SemanticTextRow{
 const sourceRows=row.sourceTextInstanceIds.map(id=>{
  const source=P004_TEXT_OCCURRENCES.find(item=>item.instanceId===id);
  if(!source)throw Error('P004 equation source instance unavailable');return source;
 });
 return Object.freeze({id:row.id,kind:'semanticMath',text:row.text,role:'body',language:'en',
  sourceTextIds:row.sourceTextIds,sourceShapeIds:Object.freeze(row.sourceShapeAnchors.map(shape=>shape.characterId)),
  instanceIds:Object.freeze([...row.sourceTextInstanceIds,...row.sourceShapeAnchors.map(shape=>shape.instanceId)]),
  instances:Object.freeze([...sourceRows.map(instance),...row.sourceShapeAnchors.map(shapeInstance)]),
  math:Object.freeze({expression:row.text,operator:'multiplication',sourceOperator:'x',
   geometryAuditSha256:P004_EQUATION_EVIDENCE_V1.geometryAuditSha256,
   teachingDecisionSha256:P004_EQUATION_EVIDENCE_V1.teachingDecisionSha256,ariaLabel:row.ariaLabel}),
  revealPolicy:P004_SEMANTIC_TEXT_POLICY.reveal});
}
function pairRow(row:(typeof P004_SEMANTIC_PAIRS_V1)[number]):P004SemanticTextRow{
 return Object.freeze({id:row.id,kind:'semanticPair',text:row.text,role:'label',language:'en',
  sourceTextIds:row.sourceTextIds,instanceIds:row.instanceIds,
  instances:Object.freeze(row.instanceIds.map(id=>instance(P004_TEXT_OCCURRENCES.find(item=>item.instanceId===id)!))),
  math:null,pair:Object.freeze({label:row.label,value:row.value,kind:row.kind}),revealPolicy:P004_SEMANTIC_TEXT_POLICY.reveal});
}
const equations=P004_EQUATION_STATES_V1.map(equationRow);
const pairs=P004_SEMANTIC_PAIRS_V1.map(pairRow);
const excluded=new Set([...P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS,...P004_PAIR_REPLACED_INSTANCE_IDS]);
const sourceOrder=new Map<string,number>(P004_TEXT_OCCURRENCES.map((row,index)=>[row.instanceId,index*10]));
const mathOrder=new Map(P004_EQUATION_STATES_V1.map((row,index)=>[row.id,
 (sourceOrder.get(row.kind==='rule'?'sprite-95/depth-81/generation-1':'sprite-95/depth-82/generation-5')!)+index+1]));
const pairOrder=new Map(P004_SEMANTIC_PAIRS_V1.map(row=>[row.id,sourceOrder.get(row.instanceIds[0])!+7]));
const order=(id:string)=>mathOrder.get(id)??pairOrder.get(id)??sourceOrder.get(id)!;
export function p004SemanticText(frame:number):readonly P004SemanticTextRow[]{
 const result:P004SemanticTextRow[]=[...p004EquationRows(frame).map(equationRow),...p004SemanticPairs(frame).map(pairRow)];
 for(const row of p004TextOccurrences(frame)){
  const reveal=P004_SENTENCE_REVEAL[row.instanceId as keyof typeof P004_SENTENCE_REVEAL];
  if(excluded.has(row.instanceId)||(reveal!==undefined&&frame<reveal))continue;
  result.push(Object.freeze({id:row.instanceId,kind:'source-text',text:row.text,role:role(row),language:'en',
   sourceTextIds:Object.freeze([...row.sourceTextIds]),instanceIds:Object.freeze([row.instanceId]),
   instances:Object.freeze([instance(row)]),math:null,revealPolicy:P004_SEMANTIC_TEXT_POLICY.reveal}));
 }
 return Object.freeze(result.sort((a,b)=>order(a.id)-order(b.id)));
}
/** Bind phase unions for inventory; visible row metadata uses only that frame's
 * active source anchors. Original Canvas is retained, never suppressed here. */
export const P004_SEMANTIC_TEXT_BINDING:LessonTextBinding & {readonly sourceInstancesByBlock:Readonly<Record<string,readonly LessonTextInstance[]>>}=Object.freeze({
 schemaVersion:1,version:'alg-l06-p004-substitution-v5',placementId:'shared-alg001-l06-p004',animationId:'shared-alg001-l06-p004',
 sourceSwfSha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e',template:'explanation',
 blocks:Object.freeze([...P004_TEXT_OCCURRENCES.map(row=>Object.freeze({id:row.instanceId,
  sourceTextIds:Object.freeze([...row.sourceTextIds]),role:role(row),language:'en' as const,readingOrder:sourceOrder.get(row.instanceId)!,instance:instance(row),valueSource:'source-static' as const})),
  ...[...equations,...pairs].map(row=>Object.freeze({id:row.id,sourceTextIds:row.sourceTextIds,sourceShapeIds:row.sourceShapeIds,role:row.role,language:'en' as const,
   readingOrder:order(row.id),instance:row.instances[0],valueSource:'maintained-page-state' as const}))]),
 sourceInstancesByBlock:Object.freeze(Object.fromEntries([
  ...P004_TEXT_OCCURRENCES.map(row=>[row.instanceId,Object.freeze([instance(row)])]),...[...equations,...pairs].map(row=>[row.id,row.instances])])),
});
