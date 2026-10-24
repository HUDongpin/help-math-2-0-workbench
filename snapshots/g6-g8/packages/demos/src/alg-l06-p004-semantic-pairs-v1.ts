import {P004_TEXT_OCCURRENCES} from './alg-l06-p004-text-occurrences-v2.generated';
/** Modern reading associations from exact source placements, not translated
 * content or added numerical examples. Source Canvas remains untouched.
 * Variable pairs cite the same complete formula run as related evidence; these
 * references are not distinct glyph instances or Canvas-suppression ownership. */
export const P004_PAIR_SOURCE_SHA256='c6f15d46da49019e359a44f407cb0577f7cfb6a7a0c1b68ab06d43084aa3adc6';
const at=(depth:number,generation=1)=>`sprite-95/depth-${depth}/generation-${generation}`;
const source=(id:string)=>{
 const row=P004_TEXT_OCCURRENCES.find(item=>item.instanceId===id);
 if(!row)throw Error(`P004 pair source missing: ${id}`);return row;
};
function pair(id:string,labelId:string,valueId:string,variable?:'C'|'M'){
 const label=source(labelId),value=source(valueId);
 const term=label.text.trim().replace(/:$/,'');
 if(variable&&!value.text.includes(variable))throw Error('P004 pair variable absent from source equation');
 const definition=variable??value.text;
 return Object.freeze({id,label:`${term}:`,value:definition,text:`${term}: ${definition}`,
  firstFrame:Math.max(label.firstFrame,value.firstFrame),lastFrameExclusive:Math.min(label.lastFrameExclusive,value.lastFrameExclusive),
  instanceIds:Object.freeze([labelId,valueId]),sourceTextIds:Object.freeze([...label.sourceTextIds,...value.sourceTextIds]),
  replaces:Object.freeze(variable?[labelId]:[labelId,valueId]),
  kind:variable?'equation-variable' as const:'price' as const});
}
export const P004_SEMANTIC_PAIRS_V1=Object.freeze([
 pair('price-lemonade',at(71),at(72)),
 pair('price-orange-juice',at(76),at(77)),
 pair('variable-input',at(105),at(80,5),'C'),
 pair('variable-output',at(109),at(80,5),'M'),
]);
export const P004_PAIR_REPLACED_INSTANCE_IDS=Object.freeze(P004_SEMANTIC_PAIRS_V1.flatMap(row=>row.replaces));
export function p004SemanticPairs(frame:number){
 if(!Number.isSafeInteger(frame)||frame<1||frame>831)throw new RangeError('P004 pair frame must be in1..831');
 return Object.freeze(P004_SEMANTIC_PAIRS_V1.filter(row=>row.firstFrame<=frame&&frame<row.lastFrameExclusive));
}
