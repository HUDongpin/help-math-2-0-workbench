#!/usr/bin/env node
/** Source-backed queue and prospective work-unit metrics; no acceptance writes. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {pinFile, readPin, REGISTRY} from '../lib/g678-admission-proof.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='work/g678-workflow', EVENTS=`${OUT}/events.jsonl`;
const json=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const save=(file,value)=>{fs.mkdirSync(path.dirname(path.join(ROOT,file)),{recursive:true});fs.writeFileSync(path.join(ROOT,file),JSON.stringify(value,null,2)+'\n');};
function registryIds() {return json(REGISTRY).calibrations.flatMap(c=>c.entries.map(e=>e.key)).filter(id=>id.startsWith('shared-')).sort();}
function events() {return fs.existsSync(path.join(ROOT,EVENTS)) ? fs.readFileSync(path.join(ROOT,EVENTS),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];}
function append(value) {fs.mkdirSync(path.join(ROOT,OUT),{recursive:true});fs.appendFileSync(path.join(ROOT,EVENTS),JSON.stringify(value)+'\n');}
/** Report each placement once; retain duplicate claims and original finish flags.
 * Event writes remain serialized by the caller; this is not a cross-process lock. */
export function measureWorkUnits(logs, measuredAt=Date.now()) {
 const completed=logs.filter(e=>e.event==='finish');
 const reworkEvents=logs.filter(e=>e.event==='rework-observed');
 const claims=new Map();
 for(const unit of completed) for(const id of unit.newlyIntegratedPages) {
  if(!claims.has(id))claims.set(id,[]);
  claims.get(id).push(unit.unit);
 }
 return {
  reworkEvents,completedUnits:completed.length,newlyIntegratedPages:claims.size,
  integrationClaimCount:completed.reduce((n,e)=>n+e.newlyIntegratedPages.length,0),
  duplicateIntegrationClaims:[...claims].filter(([,units])=>units.length>1)
   .map(([animationId,units])=>({animationId,units})),
  openUnits:logs.filter(e=>e.event==='start'&&!completed.some(done=>done.unit===e.unit))
   .map(e=>({unit:e.unit,lane:e.lane,startedAt:e.at,elapsedSeconds:(measuredAt-Date.parse(e.at))/1000,
    status:'open-not-counted-as-completed',reviewDue:measuredAt-Date.parse(e.at)>=45*60*1000})),
  latestIntegratedEvidence:completed.filter(e=>e.outcome==='integrated').at(-1)?.evidence??null,
  // Per-unit pages and seconds retain their recorded claims; only the total is unique.
  unitSeconds:completed.map(e=>({unit:e.unit,lane:e.lane,elapsedSeconds:e.elapsedSeconds,
   rework:e.rework||reworkEvents.some(observation=>observation.unit===e.unit),
   finishRework:e.rework,reworkObservationCount:reworkEvents.filter(observation=>observation.unit===e.unit).length,
   pages:e.newlyIntegratedPages.length,
   secondsPerIntegratedPage:e.newlyIntegratedPages.length?e.elapsedSeconds/e.newlyIntegratedPages.length:null})),
 };
}
export function assertUnclaimedIntegrationPages(logs, pages) {
 const claimed=new Set(logs.filter(e=>e.event==='finish').flatMap(e=>e.newlyIntegratedPages));
 const duplicates=pages.filter(id=>claimed.has(id));
 assert(duplicates.length===0,`integration pages already claimed: ${duplicates.join(', ')}`);
}
export function buildQueue() {
 const manifestPath='catalog/g678-page-only-release-manifest.v1.json';
 const structuralPath='catalog/g678-pure-linear-structural-inventory-v1.json';
 const manifest=json(manifestPath), structural=json(structuralPath), registered=new Set(registryIds());
 const records=new Map(structural.records.flatMap(r=>r.placementIds.map(id=>[id,r])));
 const members=manifest.releases.flatMap(r=>r.members), seen=new Set();
 const queue=members.map(member=>{
  assert(!seen.has(member.animationId),'unique active placement');seen.add(member.animationId);
  const record=records.get(member.animationId);
  assert(record && record.sourceSha256===member.source.sha256,'source-hash-bound structural classification');
  const c=record.classification;
  const family=c.structuralCandidate ? 'linear-needs-script-review' : c.childScriptCount>0 ? 'scripted-state-and-feedback' :
    c.buttonCount>0 ? 'buttons-and-glossary-needs-behavior-review' : c.soundStreamHeadCount>0 ? 'nested-audio-timeline' : 'exception-needs-source-review';
  return {animationId:member.animationId,sourceSha256:member.source.sha256,sectionCode:member.sectionCode,
   registryMember:registered.has(member.animationId),family,lane:c.structuralCandidate?'factory-candidate':'unclassified',
   sourceFeatures:c,classificationScope:'dated-source-structural-only',scaleOutAuthorized:false,
   nextAction:c.structuralCandidate?'review exact scripts and complete one product representative':'audit behavior before selecting adapter or manual lane'};
 });
 const p012=queue.find(p=>p.animationId==='shared-alg001-l12-p012');
 const triage='output/p011-source-triage-20260927-v1/SOURCE_TRIAGE_P012_2026-09-27.md';
 assert(p012 && p012.sourceSha256==='b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa');
 Object.assign(p012,{family:'coordinate-movement-and-coach',lane:'advanced-manual',classificationScope:'source-script-triage',
  evidence:pinFile(ROOT,triage),nextAction:p012.registryMember ? 'registered local Current-JS; preserve independent original-runtime and acceptance gates' : 'pure movement/coach/replay reducer; keep this exception out of linear batches'});
 const glossaryFamilyEvidence=pinFile(ROOT,'output/g678-family-nms002-l02-20260927/NMS002_L02_GLOSSARY_FAMILY_PILOT_2026-09-27.md');
 const glossaryMissingSource=pinFile(ROOT,'output/g678-family-nms002-l02-20260927/L2_KEYTERM_XML_LOCATION_CHECK_2026-09-27.md');
 const glossaryFamilySources={
  'shared-nms002-l02-p055':'8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e',
  'shared-nms002-l02-p056':'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be',
  'shared-nms002-l02-p057':'9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa',
  'shared-nms002-l02-p058':'fc26d0a7049db6b8ce5532cfbed1fcb380c75e503d9c7cb7974bea73b8505d57',
 };
 for(const [id,sha] of Object.entries(glossaryFamilySources)) {
  const page=queue.find(item=>item.animationId===id);
  assert(page && page.sourceSha256===sha,'reviewed NMS L2 glossary family source identity');
  Object.assign(page,{family:'glossary-pause-nms002-l02-ts',lane:'factory-candidate',classificationScope:'source-script-triage',
   evidence:glossaryFamilyEvidence,blockerEvidence:glossaryMissingSource,
   nextAction:'P055 representative then P056 reuse; exact L2 glossary definitions unresolved; no product admission or scale-out yet'});
 }
 const nmsCandidate='output/nms-l02-ts-family-20260927/local-candidate-v1.json';
 if(fs.existsSync(path.join(ROOT,nmsCandidate))){
  const candidate=json(nmsCandidate),page=queue.find(p=>p.animationId==='shared-nms002-l02-p055');
  assert(candidate.kind==='g678-local-candidate-v1'&&candidate.animationId===page.animationId&&
   candidate.formal===false&&candidate.registered===false,'P055 standalone candidate boundary');
  Object.assign(page,{implementationEvidence:pinFile(ROOT,nmsCandidate),
   nextAction:'Native text/main-audio candidate implemented; reconcile glossary source and build one reviewed NMS host successor before My Lesson admission or P056 reuse'});
 }
 for(const id of ['shared-alg001-l12-p013','shared-alg001-l12-p015']) {
  const auditPath=`migrations/${id}/audit/capability-support-2026-09-27.json`;
  const audit=json(auditPath), page=queue.find(item=>item.animationId===id);
  assert(page && audit.animationId===id && audit.source.sha256===page.sourceSha256,'reviewed ALG L12 pair source identity');
  assert(path.isAbsolute(audit.source.path),'physical source path required');
  readPin(path.dirname(audit.source.path),{...audit.source,path:path.basename(audit.source.path)});
  Object.assign(page,{family:'glossary-pause-alg001-l12-pair',lane:'factory-candidate',
   classificationScope:'source-capability-assessment',evidence:pinFile(ROOT,auditPath),
   nextAction:page.registryMember ? 'verify admitted My Lesson path; preserve independent acceptance gates' : audit.nextAction});
 }
 // Source-audited ALG L6 continuation; structural grouping alone grants no scale-out.
 for(const ordinal of ['010','013']){
  const id=`shared-alg001-l06-p${ordinal}`,auditPath=`migrations/${id}/audit/source-v1/source-audit-v1.json`;
  if(!fs.existsSync(path.join(ROOT,auditPath)))continue;
  const audit=json(auditPath),page=queue.find(item=>item.animationId===id);
  assert(page&&audit.animationId===id&&audit.source.sha256===page.sourceSha256,'ALG L6 exact source audit');
  Object.assign(page,{family:'source-native-text-glossary-embedded-audio',
   lane:page.registryMember?'advanced-manual':'interactive-understood-candidate',
   classificationScope:'source-behavior-audit',evidence:pinFile(ROOT,auditPath),
   nextAction:page.registryMember?'registered local Current-JS; preserve separate runtime/listening/acceptance gates':
    'reuse existing P013 workspace; audit exact Input/Output glossary binding, extract continuous stream, then maintained renderer/native text and explicit separate SA in real My Lesson'});
 }
 const families=[...new Set(queue.map(p=>p.family))].sort().map(family=>{
  const members=queue.filter(p=>p.family===family && !p.registryMember);
  return {family,remaining:members.length,representative:members[0]?.animationId??null,
   maxPilotPages:1,maxBatchPages:5,scaleOutAuthorized:false,gate:'source behavior plus full My Lesson representative required'};
 });
 const logs=events();
 const result={schemaVersion:1,generatedAt:new Date().toISOString(),inputs:[pinFile(ROOT,manifestPath),pinFile(ROOT,structuralPath),pinFile(ROOT,REGISTRY)],
  counts:{activePages:queue.length,registryMembers:queue.filter(p=>p.registryMember).length,remaining:queue.filter(p=>!p.registryMember).length},
  measurement:{historicalPerPageSeconds:null,historicalReworkSeconds:null,reason:'No reliable historical per-page timer; not reconstructed from token counts.',
   ...measureWorkUnits(logs)},
  calibratedExamples:[{family:'source-native-text-glossary-embedded-audio',representatives:['shared-alg001-l12-p009','shared-alg001-l12-p010'],
   reuse:'native text and audio lifecycle architecture; per-page source schedule and semantics remain required',scaleOutAuthorized:false}],families,queue};
 assert(result.counts.activePages===2282);
 return result;
}
function writeCurrent(report) {
 const latest=events().filter(e=>e.event==='finish'&&e.outcome==='integrated'&&e.newlyIntegratedPages?.length).at(-1);
 const activeCandidate=latest?.newlyIntegratedPages.at(-1)??'shared-alg001-l06-p027';
 const candidateCheckpoint=`migrations/${activeCandidate}/CURRENT_JS_CANDIDATE_2026-10-01.md`;
 const candidate=report.queue.find(page=>page.animationId===activeCandidate);
 const hasCandidate=fs.existsSync(path.join(ROOT,candidateCheckpoint))&&candidate;
 const pair=['shared-alg001-l12-p013','shared-alg001-l12-p015'].map(id=>report.queue.find(page=>page.animationId===id));
 assert(pair.every(Boolean),'two source-backed glossary family rows');
 const pairStatus=pair.map(page=>`${page.animationId}: ${page.registryMember?'registered':'unregistered'}`).join('; ');
 const pairNext=pair.find(page=>!page.registryMember)?.animationId??'none remaining in this pair';
 const lines=[
 '# G6–G8 current execution state', '',
 `Generated ${report.generatedAt} from the real registry and source-bound queue.`, '',
 `- Registry membership: **${report.counts.registryMembers}/${report.counts.activePages}**; remaining **${report.counts.remaining}**. This is not a fresh whole-catalog host or acceptance audit.`,
 '- Active proof path: apps/web/lib/g678-split-admission.server.ts and its imported activation index. P006/P009/P010 old freeze bytes and historical observations remain retained.',
 '- Queue and source features: work/g678-workflow/CURRENT.json. Structural grouping is not behavior calibration.',
 `- Work-unit clock: work/g678-workflow/events.jsonl. ${report.measurement.completedUnits} measured completed units; ${report.measurement.newlyIntegratedPages} unique newly integrated pages in those units; ${report.measurement.integrationClaimCount} recorded page claims; ${report.measurement.duplicateIntegrationClaims.length} duplicated page IDs. Historical timing is unknown. Rework observations: ${report.measurement.reworkEvents.length}.`,
 ...report.measurement.openUnits.map(unit=>`- Open ${unit.lane} unit: ${unit.unit}; observed wall time ${Math.round(unit.elapsedSeconds)} seconds; not a completed page.${unit.reviewDue ? ' 45-minute bottleneck review is due.' : ''}`),
 '- Full goal remains all 2,282 active placements. Infrastructure work contributes zero pages; only actual registered host integrations count.',
 `- P012 registry membership: ${report.queue.find(page=>page.animationId==='shared-alg001-l12-p012').registryMember ? 'registered; active proof catalog/g678-admission-v1/shared-alg001-l12-p012.json' : 'unregistered; implementation checkpoint migrations/shared-alg001-l12-p012/evidence/HOST_INTEGRATION_2026-09-27.md'}.`,
 '- Original-runtime, fidelity, listening, human/Owner, strict completion and publication remain independent.', '',
 ...(hasCandidate ? [
  '## Latest implementation checkpoint', '',
  `Current bounded page: ${activeCandidate}; registry membership: ${candidate.registryMember?'registered':'unregistered'}. Read ${candidateCheckpoint} for current implementation, exact evidence and remaining engineering checks. This checkpoint supersedes the historical next-step suggestions below.`,
  'The open work-unit elapsed time is observation-to-now wall time; it is not active labor, model execution time or a verified page-completion timestamp.', '',
 ] : []),
 '## Next execution', '',
 'Use skills/flash-to-js/references/current-js-throughput.md. Select a source-family representative, start a measured unit, exercise the real producer/reader roundtrip early, and use the existing modern host. Do not clone old per-page proof-refresh scripts.', '',
 `Completed bounded ALG family: ${pairStatus}. Next unregistered ALG-pair representative: ${pairNext}. Per-page capability assessments are in migrations/<id>/audit/capability-support-2026-09-27.json. Preserve P015 global-S read and P013 signed-seek differences. Source presence and registration are not downstream acceptance.`, '',
 ...report.queue.filter(p=>p.animationId==='shared-nms002-l02-p055'&&p.implementationEvidence).flatMap(p=>[
  `Current bounded family: NMS002 L02 TS. P055 remains ${p.registryMember?'registered':'unregistered'}; candidate evidence: ${p.implementationEvidence.path}. ${p.nextAction}.`,
  'Implementation checkpoint: migrations/shared-nms002-l02-p055/evidence/LOCAL_CANDIDATE_2026-09-27.md. Host successor requirements: output/nms-l02-ts-family-20260927/host/NMS_HOST_SUCCESSOR_REQUIREMENTS_2026-09-27.md. Preserve prior frozen proofs and leave P056/P057/P058 expansion closed until representative My Lesson calibration.', '',
 ]),
 '| Investigation family | Remaining | Representative |', '| --- | ---: | --- |',
 ...report.families.map(f=>`| ${f.family} | ${f.remaining} | ${f.representative??'none'} |`), '',
 `Latest integration evidence: ${report.measurement.latestIntegratedEvidence?.path ?? 'reports/G678_ADMISSION_DECOUPLING_2026-09-27.md'}. Read the dated receipt for its exact validation limits.`, '',
 ];
 fs.writeFileSync(path.join(ROOT,'CURRENT_G678.md'),lines.join('\n'));
}

async function main() {
 const [command,unit,arg,...rest]=process.argv.slice(2);
 if(command==='preflight') {
  assert(unit,'preflight <fragment.json>');
  const {preflightRegistrationFile}=await import('./lib/g678-registration-preflight-v1.mjs');
  const result=await preflightRegistrationFile(ROOT,unit);
  console.log(JSON.stringify({status:result.status,registered:result.registered,fragment:result.fragment,
   freeze:result.freeze,entries:result.registration.entries.map(e=>e.key),note:result.note},null,2));
 } else if(command==='check') {
  const {checkG678LessonTypography}=await import('./check-g678-lesson-typography-split.mjs');
  const result=await checkG678LessonTypography({root:ROOT});console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
 } else if(command==='report') {const report=buildQueue();save(`${OUT}/CURRENT.json`,report);writeCurrent(report);console.log(JSON.stringify({counts:report.counts,families:report.families}));}
 else if(command==='start') {
  assert(unit && ['factory','advanced-manual','infrastructure'].includes(arg),'start <unit> <lane>');
  assert(!events().some(e=>e.unit===unit),'unique work unit');
  append({event:'start',unit,lane:arg,at:new Date().toISOString(),registryIds:registryIds()});
 } else if(command==='rework') {
  assert(unit && arg,'rework <unit> <evidence-path>');
  const evidence=pinFile(ROOT,arg);readPin(ROOT,evidence);
  append({event:'rework-observed',unit,at:new Date().toISOString(),elapsedSeconds:null,evidence,
    reason:rest.join(' ')||'See retained failure evidence; no retrospective duration inferred.'});
 } else if(command==='finish') {
  const start=events().find(e=>e.event==='start'&&e.unit===unit);assert(start && !events().some(e=>e.event==='finish'&&e.unit===unit),'open unit');
  assert(['integrated','blocked','infrastructure'].includes(arg),'finish outcome');
  const now=new Date(), evidencePath=rest[0], rework=rest[1]==='rework';
  let newlyIntegratedPages=[], evidence=null;
  if(arg==='integrated') {
   assert(start.lane!=='infrastructure' && evidencePath,'page evidence required');
   evidence=pinFile(ROOT,evidencePath);const result=JSON.parse(readPin(ROOT,evidence).toString());
   assert(result.kind==='g678-host-verification-v1' && result.results.length>0 && Array.isArray(result.pageErrors) && result.pageErrors.length===0 && Date.parse(result.checkedAt)>=Date.parse(start.at) && Date.parse(result.checkedAt)<=now.getTime()+1000,'fresh successful host receipt within this work unit');
   const current=new Set(registryIds());
   newlyIntegratedPages=[...new Set(result.results.filter(r=>r.status===200 && r.ready===true && r.formal===true).map(r=>r.animationId))]
    .filter(id=>current.has(id)&&!start.registryIds.includes(id));
   assert(newlyIntegratedPages.length>0 && newlyIntegratedPages.every(id=>['en','es'].every(locale=>result.results.some(r=>r.animationId===id && r.locale===locale && r.status===200 && r.ready===true && r.formal===true))),'new registered page needs EN/ES host results');
   // Re-read immediately before append; callers must serialize event writes.
   assertUnclaimedIntegrationPages(events(),newlyIntegratedPages);
  }
  append({event:'finish',unit,lane:start.lane,at:now.toISOString(),elapsedSeconds:(now-Date.parse(start.at))/1000,
   outcome:arg,rework,newlyIntegratedPages,evidence});
 } else throw Error('Use preflight <fragment.json> | report | start <unit> <lane> | finish <unit> <integrated|blocked|infrastructure> [host-receipt] [rework]');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
