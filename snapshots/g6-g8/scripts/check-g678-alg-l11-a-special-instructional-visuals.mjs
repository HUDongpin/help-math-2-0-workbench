#!/usr/bin/env node
import {readFile,writeFile,lstat,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const RUN='work/g678-shared-page-factory/g678-alg-l11-a-special-instructional-visuals-v2';
const OUT='catalog/g678-alg-l11-a-special-instructional-visual-successor-v2.json';
const PREDECESSOR={path:'catalog/g678-alg-l11-a-special-instructional-visual-successor-v1.json',bytes:16542,
 sha256:'e9435a18a129b189a824c38b55e6b54788c5d0cfcc67f5821aca725b0a6877e5'};
const RUNTIME_QA={path:'output/playwright/g678-alg-l11-a-special-mounted-v6/evidence.json',bytes:77317,
 sha256:'fea960b47e5972ac7c7ba64ae58404942a4a8d5d6e7d5a0dae5939b478b53121'};
const sha=b=>createHash('sha256').update(b).digest('hex');
function assert(v,m){if(!v)throw Error(m);}
async function binding(p){const file=path.isAbsolute(p)?p:path.join(ROOT,p),stat=await lstat(file);assert(stat.isFile()&&!stat.isSymbolicLink(),`Nonregular ${p}`);const data=await readFile(file);return {path:p,bytes:data.length,sha256:sha(data)};}
async function check(expected){const actual=await binding(expected.path);assert(actual.sha256===expected.sha256&&actual.bytes===expected.bytes,`Binding changed: ${expected.path}`);}
async function countFiles(dir){let count=0;for(const name of await readdir(dir)){const p=path.join(dir,name),s=await lstat(p);assert(!s.isSymbolicLink(),'Run symlink');if(s.isDirectory())count+=await countFiles(p);else {assert(s.isFile(),'Run special file');count++;}}return count;}
const manifest=JSON.parse(await readFile(path.join(ROOT,RUN,'manifest.json'),'utf8'));
await check(PREDECESSOR);await check(RUNTIME_QA);
const runtimeQa=JSON.parse(await readFile(path.join(ROOT,RUNTIME_QA.path),'utf8'));
assert(runtimeQa.status==='passed'&&runtimeQa.inputsUnchanged===true&&runtimeQa.records.length===6&&
 runtimeQa.records.every(r=>r.status==='passed'&&r.errors.length===0&&r.requests.length===0),'Mounted runtime QA boundary changed');
for(const input of runtimeQa.inputs)await check(input);
for(const b of [manifest.sourceAudit,manifest.glossaryAudit,manifest.sourceVectorManifest,manifest.builder,manifest.normalizer,...manifest.files])await check(b);
assert(await countFiles(path.join(ROOT,RUN))===manifest.files.length+1,'Unexpected run file set');
const pages=[];
for(const member of manifest.members){
 await check(member.config);
 const config=JSON.parse(await readFile(path.join(ROOT,member.config.path),'utf8'));
 assert(process.env.HELP_MATH_G678_SOURCE_ROOT,'Source root required');
 const source=await binding(path.join(process.env.HELP_MATH_G678_SOURCE_ROOT,config.source.path));
 assert(source.sha256===config.source.sha256&&source.bytes===config.source.bytes,'Current SWF changed');
 await check(config.mainVectorBundle);await check(config.sourceXml);
 for(const script of config.sourceScripts)await check(script);
 const isChoice=member.animationId.endsWith('p006');
 assert(isChoice?config.answers.map(a=>a.depth).join(',')==='6,24,26':config.dormantFeedbackDisposition.localStartInvocationCount===0,'Interaction evidence changed');
 pages.push({animationId:member.animationId,config:member.config,mainVectorBundle:config.mainVectorBundle,
  kind:config.kind,mainFrames:config.frameCount,sourceAnswerPlacementCount:config.answers?.length??0,
  feedbackSourceFrames:isChoice?40:0,glossaryEntryIds:config.glossaryEntries.map(e=>e.id),
  sourceMainGlossaryRanges:config.glossaryControls.length,popupGlossaryControls:config.feedback?.wrong.glossaryControls.length??0,
  dormantFeedbackDisposition:config.dormantFeedbackDisposition??null,
  dormantAudioLabelDomain:config.audioLabelDomain??null,sourceSemanticCorrection:config.sourceSemanticCorrection??null,
  sourceParentAdapter:config.maintainedAdapter??null});
}
const previewRoot='work/g678-shared-page-factory/g678-alg-l11-a-special-visual-inspection-v1';
const previews=await Promise.all((await readdir(path.join(ROOT,previewRoot))).filter(x=>x.endsWith('.png')).sort().map(x=>binding(`${previewRoot}/${x}`)));
const files=['packages/demos/src/g678-alg-l11-a-special-instructional-visuals.tsx',
 'packages/demos/tests/g678-alg-l11-a-special-instructional-visuals.test.tsx',
 'scripts/check-g678-alg-l11-a-special-instructional-visuals.mjs'];
const output={schemaVersion:1,artifactType:'g678-alg-l11-a-special-instructional-visual-successor-v2',
 status:'local-unregistered-proven-active-source-visual-and-interaction-successor',run:await binding(`${RUN}/manifest.json`),
 predecessor:PREDECESSOR,mountedRuntimeEvidence:RUNTIME_QA,
 maintained:await Promise.all(files.map(binding)),pages,previews,
 implementation:{sourceTeachingFrames:878,p006SourceFeedbackFrames:40,p006SourceAnswerPlacements:3,
  sourceMainGlossaryPlacementRanges:20,p006PopupGlossaryControls:5,dormantTwoTryControlsCreated:0,
  candidateAudioLabelPlaybackStarted:false,authoredSeekControlsDeclared:0,
  mountedRuntimeCasesPassed:6,sourceAnswerHostBranchIndex:1,hostResetOnMountAndReplay:true,
  reducedMotionSourceQuestionOrCompleteTeachingState:true},
 originalRuntimeGaps:['p006 close-button this/_parent resolution remains separately unestablished; maintained dismissal reenables exact3 source option placements',
  'p006 audio Coach_audio_1 is source-placed/stopped1; no local source event starts it, external host entry remains unestablished',
  'p009/p010 Mc_Wrong_Feed3 is source-placed/stopped1; no main action, local start, or NMHBtn exists; possible historical host entry remains unestablished',
  'modern glossary uses established typed glossary support-pause contract; original shell stop/resume fidelity remains independent'],
 productIntegrationNeeds:['merge source-exact glossary entries into admitted descriptor glossary; reconcile entries already present, including solve',
  'bind successor module and sourceVector/interaction config bytes in reviewed local registration',
  'exercise actual main/feedback/glossary lifecycle in the modern host at desktop and mobile sizes'],
 acceptanceEffects:{registered:false,productCalibrationPassed:false,browserQa:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
  audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
const bytes=JSON.stringify(output,null,2)+'\n';
if(process.argv.includes('--write'))await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
else assert(await readFile(path.join(ROOT,OUT),'utf8')===bytes,'Successor receipt changed');
console.log(JSON.stringify({manifest:await binding(OUT),implementation:output.implementation,allInputBindingsVerified:true}));
