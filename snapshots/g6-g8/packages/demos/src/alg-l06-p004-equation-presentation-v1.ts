import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
import {p004TextOccurrences} from './alg-l06-p004-text-occurrences-v2';

/** Source-locked, maintained reading rows. Canvas still draws the original glyphs.
 * The reviewed decision is an interpretation of source geometry and direct alpha,
 * not a claim about original-runtime pixels or audio. */
export const P004_EQUATION_EVIDENCE_V1=Object.freeze({
 sourceSwfSha256:'514867e794dbc86059a452c5f1091cabfabf73e6f7918d0d28d9cf7ee604573e',
 sourceTextSha256:'c6f15d46da49019e359a44f407cb0577f7cfb6a7a0c1b68ab06d43084aa3adc6',
 sourceAnalysisSha256:'a9c39c0b0c77b9a3b0b2d1ed574cda2320d58509f8e44ec859a0097e0f1da80e',
 teachingDecisionSha256:'5cd52d5bc3789c6672dd65a97caef90210704cac69ca92a2ebb0577f9feaff62',
 geometryAuditSha256:'080019ad49d6d1513beaffd7bf5a234183deabdec5af144c9f048c142f2aeab2',
 substitutionDecisionSha256:'ad1ed27e8110e8e4c9ae8c3ca0d87a350a61adf067eb2cb44600d6b03a1b9397',
});

const id=(depth:number,generation:number)=>`sprite-95/depth-${depth}/generation-${generation}`;
const intro=Object.freeze(Array.from({length:9},(_,i)=>id(81+i,1)));
const stable=Object.freeze([id(80,5),id(81,2)]);
const moving=Object.freeze([id(82,4),id(83,2)]);
const worked=Object.freeze([[82,5],[83,3],[84,2],[85,2],[86,2],[87,2],[88,2],[89,2],[90,3],[91,1],[87,3]].map(([depth,generation])=>id(depth,generation)));
const emphasis=Object.freeze([
 ...Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>id(113+j,i+1))).flat(),
 ...Array.from({length:5},(_,i)=>id(113,i+6)),
]);
const outro=Object.freeze([
 ...Array.from({length:5},(_,i)=>Array.from({length:5},(_,j)=>id(113+j,j===0?i+16:i+6))).flat(),
 ...Array.from({length:10},(_,i)=>id(113,i+21)),
]);

export const P004_EQUATION_SOURCE_GROUPS_V1=Object.freeze({introGlyphs:intro,stableRule:stable,movingRuleCopy:moving,workedExample:worked,workedEmphasisCopies:emphasis,outroEmphasisCopies:outro});

export const P004_EQUATION_SOURCE_SHAPES_V1=Object.freeze([
 Object.freeze({characterId:49,instanceId:id(80,3),firstFrame:84,lastFrameExclusive:92,
  sourceTagSha256:'705f008cf74c41f1e79fb9fd5d50427d80324edb4d13da6f2935947c93982abe',
  placementTagSha256:'963ff830ea22746c39371f4c09d1aad5ee42d1d60385c4aec5adc9f17994b132',
  role:'transitional-rule-outline' as const}),
 Object.freeze({characterId:50,instanceId:id(80,4),firstFrame:92,lastFrameExclusive:93,
  sourceTagSha256:'18548492ba9b4fab8e715d76d694aea4e4220a233959f1bc7da404e3d030b717',
  placementTagSha256:'e43416c4fb19543f414a091e2d7942066a01c543449fed425cfd34e5f1c25f3b',
  role:'completed-rule-outline' as const}),
]);

/** The completed outline 5 precedes its DefineText replacement by one frame. */
export const P004_SUBSTITUTION_SOURCE_SHAPE_V1=Object.freeze({
 characterId:67,instanceId:id(90,2),firstFrame:314,lastFrameExclusive:315,
 sourceTagSha256:'6e8a4299ff4a5b658784889e02a5d72e3928d256c8e700e99e36be271f09a545',
 placementTagSha256:'68ec73b509c8ffc99aa193c40662b109ee40abd66505efe524f7f64b8a25c142',
 role:'completed-substitution-outline' as const,
});
type EquationShapeAnchor=(typeof P004_EQUATION_SOURCE_SHAPES_V1)[number]|typeof P004_SUBSTITUTION_SOURCE_SHAPE_V1;

/** All source text instances already represented by one of the coherent rows.
 * This includes moving/highlight copies but excludes other price and diagram text. */
export const P004_EQUATION_EXCLUDED_NATIVE_INSTANCE_IDS=Object.freeze([
 ...intro,...stable,...moving,...worked,...emphasis,...outro,
]);

function textIds(instanceIds:readonly string[]):readonly string[]{
 return Object.freeze([...new Set(instanceIds.flatMap(instanceId=>{
  const source=P004_TEXT_OCCURRENCES.find(row=>row.instanceId===instanceId);
  if(!source)throw new Error(`P004 equation source instance missing: ${instanceId}`);
  return source.sourceTextIds;
 }))]);
}

export type P004EquationRowV1=Readonly<{
 id:string;kind:'rule'|'worked';stage:string;firstFrame:number;lastFrame:number;
 text:string;ariaLabel:string;language:'en';role:'body';valueSource:'maintained-page-state';
 sourceTextIds:readonly string[];sourceTextInstanceIds:readonly string[];
 sourceShapeAnchors:readonly EquationShapeAnchor[];
}>;

function row(id:string,kind:'rule'|'worked',stage:string,firstFrame:number,lastFrame:number,text:string,ariaLabel:string,
 sourceTextInstanceIds:readonly string[],sourceShapeAnchors:readonly EquationShapeAnchor[]=[]):P004EquationRowV1{
 return Object.freeze({id,kind,stage,firstFrame,lastFrame,text,ariaLabel,language:'en',role:'body',valueSource:'maintained-page-state',
  sourceTextIds:textIds(sourceTextInstanceIds),sourceTextInstanceIds,sourceShapeAnchors});
}

const ruleText='M = $0.50 × C';
const ruleAria='M equals 0.50 dollars multiplied by C';
const baseWorked=worked.slice(0,8);
export const P004_EQUATION_STATES_V1:readonly P004EquationRowV1[]=Object.freeze([
 row('equation-intro','rule','intro-glyphs',1,83,ruleText,ruleAria,intro),
 row('equation-outline','rule','outlined-transition',84,92,ruleText,ruleAria,[],P004_EQUATION_SOURCE_SHAPES_V1),
 row('equation93','rule','stable-source-text',93,831,ruleText,ruleAria,stable),
 row('equation-worked-substitution','worked','substitution',314,366,'M = $0.50 × 5','M equals 0.50 dollars multiplied by 5',
  [...baseWorked,worked[8],worked[9]],[P004_SUBSTITUTION_SOURCE_SHAPE_V1]),
 row('equation-worked-result-with-m','worked','result-with-m',367,373,'M = $0.50 × 5 = $2.50',
  'M equals 0.50 dollars multiplied by 5, which equals 2.50 dollars',[...baseWorked,worked[9]]),
 row('equation-worked-calculation','worked','calculation',374,461,'$0.50 × 5 = $2.50',
  '0.50 dollars multiplied by 5 equals 2.50 dollars',[...worked.slice(0,5),worked[10],worked[9]]),
]);

/** The first rule remains readable during its source outline transition.
 * The answer is withheld until its direct source alpha is fully opaque at 367. */
export function p004EquationRows(frame:number):readonly P004EquationRowV1[]{
 if(!Number.isSafeInteger(frame)||frame<1||frame>831)throw new RangeError('P004 equation frame must be an integer in 1..831');
 const sourceIds=new Set<string>(p004TextOccurrences(frame).map(item=>item.instanceId));
 return Object.freeze(P004_EQUATION_STATES_V1.filter(item=>item.firstFrame<=frame&&frame<=item.lastFrame).map(item=>{
  // The result glyph is present at alpha zero on 360 and only partially
  // revealed before 367. It begins carrying the substituted 5 when the old
  // standalone 5 disappears at 364; the answer is still withheld until 367.
  const sourceTextInstanceIds=item.sourceTextInstanceIds.filter(instanceId=>sourceIds.has(instanceId)&&
   !(item.stage==='substitution'&&instanceId===id(91,1)&&frame<364));
  const sourceShapeAnchors=item.sourceShapeAnchors.filter(shape=>shape.firstFrame<=frame&&frame<shape.lastFrameExclusive);
  return Object.freeze({...item,sourceTextInstanceIds:Object.freeze(sourceTextInstanceIds),
   sourceTextIds:textIds(sourceTextInstanceIds),sourceShapeAnchors:Object.freeze(sourceShapeAnchors)});
 }));
}
