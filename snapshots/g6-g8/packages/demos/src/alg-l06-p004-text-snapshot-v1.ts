import {P004_SEMANTIC_PAIRS_V1} from './alg-l06-p004-semantic-pairs-v1';
import {P004_EQUATION_STATES_V1} from './alg-l06-p004-equation-presentation-v1';
import type {RuntimeContext} from './contract';
import {buildLessonTextSnapshot,type LessonTextValue} from './lesson-text-snapshot';
import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
import {p004SemanticText,P004_SEMANTIC_TEXT_BINDING,P004_SEMANTIC_TEXT_POLICY} from './alg-l06-p004-semantic-text-v1';
export const P004_TEXT_SNAPSHOT_POLICY=Object.freeze({
 reveal:P004_SEMANTIC_TEXT_POLICY.reveal,canvas:'retained-without-suppression',
 contentLanguage:'en',es:'source-fallback',allSourceRisksResolved:false,typographyComplete:false,
});
/** Pure adapter of the existing source clock. It neither advances nor resets it. */
export function p004TextSnapshot(context:RuntimeContext){
 if(!Number.isSafeInteger(context.frame)||context.frame<1||context.frame>831||
  context.frameDomain!=='sprite-95'||context.rootFrame!==6||context.scenario!=='source-static-frame'||
  !['en','es'].includes(context.lang)||context.seed!==0||!Number.isSafeInteger(context.replay??0)||(context.replay??0)<0)
  throw new RangeError('P004 text context must match sprite-95/root6/source-static-frame/seed0 and frame1..831');
 const active=new Map(p004SemanticText(context.frame).map(row=>[row.id,row]));
 const values:Record<string,LessonTextValue>={};
 for(const block of P004_SEMANTIC_TEXT_BINDING.blocks){
  const text=P004_EQUATION_STATES_V1.find(row=>row.id===block.id)?.text??P004_SEMANTIC_PAIRS_V1.find(row=>row.id===block.id)?.text??P004_TEXT_OCCURRENCES.find(row=>row.instanceId===block.id)?.text;
  if(text===undefined)throw Error(`P004 text binding missing source value: ${block.id}`);
  values[block.id]={text,visible:active.has(block.id)};
 }
 const snapshot=buildLessonTextSnapshot(P004_SEMANTIC_TEXT_BINDING,context,values);
 if(snapshot.status!=='ready')throw Error(`P004 text snapshot blocked: ${snapshot.blockers.join(',')}`);
 // Shared builder lists bound instances for suppression by default. This panel
 // explicitly keeps its source Canvas, so no suppression is requested or claimed.
 return Object.freeze({...snapshot,suppressedInstances:Object.freeze([])});
}
export type P004TextSnapshot=ReturnType<typeof p004TextSnapshot>;
