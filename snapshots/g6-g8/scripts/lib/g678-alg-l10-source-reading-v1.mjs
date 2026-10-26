import assert from 'node:assert/strict';
const IDS=['shared-alg001-l10-p005','shared-alg001-l10-p006'];
const collapse=text=>text.replace(/\n--- RECORDSEPARATOR ---\n/gu,' ').replace(/\s+/gu,' ').trim();
function evaluateSourceValue(value) {
 if(/^\d+$/u.test(value))return Number(value);
 const power=value.match(/^2\^(\d+)$/u);assert(power,'bounded authored numeric/power cell');return 2**Number(power[1]);
}
export async function compileAlgL10Reading({sourceSpec,mainFacts,readBound,literalReading}) {
 const index=IDS.indexOf(sourceSpec.animationId);assert(index>=0);const last=index===0?1304:1106;
 const proof=JSON.parse((await readBound(sourceSpec.sourceStructuredReading.audit.path,sourceSpec.sourceStructuredReading.audit)).bytes);
 assert.equal(proof.animationId,sourceSpec.animationId);assert.equal(sourceSpec.main.frameCount,last);
 for(const p of [proof.sourceXml,proof.sourceFacts,proof.rejectedGeometricDraft,...proof.referenceScreenshots])await readBound(p.path,p);
 const text={};for(const {characterId,...pin} of proof.sourceTexts)text[characterId]=(await readBound(pin.path,pin)).bytes.toString().trim();
 const header=index===0?7:4,dayStart=index===0?10:7;
 assert.equal(text[header],'Day');assert.equal(collapse(text[header+1]),'Number of New Students Who Heard the Rumor');
 assert.equal(collapse(text[header+2]),'Total Number of Students Who Have Heard the Rumor');
 for(const placement of proof.placements)assert(mainFacts.placementEdges.some(p=>p.characterId===placement.characterId&&p.distinctFrames.includes(placement.frame)),'source reading occurrence');
 const fullAt=(characterId,frame)=>assert(proof.lifetimes.some(p=>p.characterId===characterId&&p.fullAlphaSpans.some(([a,b])=>frame>=a&&frame<=b)),'source full-alpha teaching step');
 for(const [frame,characterId] of index===0?[[853,93],[904,95],[907,97],[910,99],[913,100],[1054,111],[1083,112],[1177,117],[1185,118],[1191,120],[1197,121],[1203,122],[1268,125]]:[[329,64],[396,66],[458,68],[510,70],[570,71],[573,72]])fullAt(characterId,frame);
 const semantic=proof.semantic;assert.deepEqual(semantic.dayLabels,Array.from({length:9},(_,i)=>collapse(text[dayStart+i])));
 assert.deepEqual(semantic.tableHeaders,['Day','New students','Total students']);
 assert.deepEqual(semantic.definitions.map(b=>b.firstFrame),index===0?[105,205,325]:[1,1,1]);
 assert.deepEqual(semantic.definitions.map(b=>b.text),['Let n = day number.','2^n = number of new students who heard the rumor on day n.','2^(n+1) − 1 = total number of students who heard the rumor.']);
 assert.deepEqual(semantic.tableStates.map(b=>b.firstFrame),index===0?[1,444,502,556,645,647,649,651,653,655,1097,1268]:[1,573]);
 const tables=semantic.tableStates.map((state,i)=>{
  assert.equal(state.lastFrame,semantic.tableStates[i+1]?.firstFrame-1||last);assert.equal(state.values.length,9);
  state.values.forEach((row,n)=>{assert.equal(row.length,2);row.forEach((value,column)=>{
   if(value==='')return;const values=value.split('=').map(v=>evaluateSourceValue(v.trim()));
   assert(values.every(v=>v===(column===0?2**n:2**(n+1)-1)),'new and cumulative source quantities remain distinct');
  });});
  return {firstFrame:state.firstFrame,lastFrame:state.lastFrame,text:semantic.tableCaption,table:{headers:semantic.tableHeaders,rows:state.values.map((row,n)=>[semantic.dayLabels[n],...row])}};
 });
 const final=semantic.tableStates.at(-1).values;
 assert.deepEqual(final,index===0?[['1','1'],['2','3'],['4','7'],['8','15'],['16','31'],['',''],['',''],['',''],['','']]:[['1','1'],['2','3'],['4','7'],['8','15'],['16','31'],['',''],['',''],['',''],['','511']],'authored blanks must not be replaced by calculated answers');
 assert.deepEqual(proof.mathIdentities.authoredTotalExamples,index===0?{'1':3,'4':31}:{'8':511});
 assert.deepEqual(literalReading,index===0?[]:[{firstFrame:1096,lastFrame:1106,text:'The essential question: why are mathematical rules necessary?'}]);
 return [...tables,...semantic.definitions,...semantic.worked,...literalReading];
}
