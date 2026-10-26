#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFile,writeFile,lstat,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-b-instructional-visual-successor-v4.json';
const AUDIT='catalog/g678-alg-l11-behavior10-tranche-b-audit-v1.json';
const IDS=['026','027','028','029','030','031','032','040','041','042'];
const sha=b=>createHash('sha256').update(b).digest('hex');
function assert(v,m){if(!v)throw Error(m);}
async function binding(rel){const p=path.isAbsolute(rel)?rel:path.join(ROOT,rel),s=await lstat(p);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1,`Not regular unique file: ${rel}`);const b=await readFile(p);return {path:rel,bytes:b.length,sha256:sha(b)};}
async function build(){
 const audit=JSON.parse(await readFile(path.join(ROOT,AUDIT),'utf8'));
 const glossaryRoot='work/g678-shared-page-factory/g678-alg-l11-b-source-glossary-v1';
 const glossaryManifest=JSON.parse(await readFile(path.join(ROOT,glossaryRoot,'manifest.json'),'utf8'));
 const glossaryEntries=JSON.parse(await readFile(path.join(ROOT,glossaryRoot,'entries.json'),'utf8'));
 const mountedPath='output/playwright/g678-alg-l11-b-instructional-mounted-v6-final/evidence.json';
 const mounted=JSON.parse(await readFile(path.join(ROOT,mountedPath),'utf8'));
 assert(mounted.status==='mounted-successor-runtime-checks-passed-unregistered'&&mounted.inputsUnchanged&&
   mounted.records.length===14&&mounted.records.every(r=>r.status==='passed'),'Mounted runtime QA incomplete');
 for(const file of mounted.inputs){const observed=await binding(file.path);assert(observed.sha256===file.sha256&&observed.bytes===file.bytes,`Mounted source changed: ${file.path}`);}
 const nestedHelpPath='catalog/g678-alg-l11-b-nested-help-close-v1.json';
 const nestedHelp=JSON.parse(await readFile(path.join(ROOT,nestedHelpPath),'utf8'));
 for(const file of [nestedHelp.sourceAudit,nestedHelp.builder,nestedHelp.geometry,nestedHelp.output]){
   const observed=await binding(file.path);assert(observed.sha256===file.sha256&&observed.bytes===file.bytes,'Nested help binding changed');}
 for(const file of [glossaryManifest.sourceAudit,glossaryManifest.glossaryAudit,glossaryManifest.builder,
   glossaryManifest.entrypoint,glossaryManifest.sourceTermResolver,glossaryManifest.vectorGeometry,glossaryManifest.entries]){
  const observed=await binding(file.path);assert(observed.sha256===file.sha256&&observed.bytes===file.bytes,`Glossary input changed: ${file.path}`);
 }
 const records=[];
 for(const suffix of IDS){
  const id=`shared-alg001-l11-p${suffix}`,version=Number(suffix)<40?3:4;
  const base=`work/g678-shared-page-factory/g678-alg-l11-b-instructional-visuals-v${version}/${id}`;
  const bundleFile=`${base}/vector-bundle.json`,bundle=JSON.parse(await readFile(path.join(ROOT,bundleFile),'utf8'));
  const receipt=JSON.parse(await readFile(path.join(ROOT,`${base}/page-receipt.json`),'utf8'));
  const member=audit.members.find(x=>x.animationId===id);
  const glossaryMember=glossaryManifest.members.find(x=>x.animationId===id);
  const glossaryBinding=await binding(glossaryMember.config.path);
  assert(glossaryBinding.sha256===glossaryMember.config.sha256&&glossaryBinding.bytes===glossaryMember.config.bytes,'Glossary config changed');
  const glossary=JSON.parse(await readFile(path.join(ROOT,glossaryBinding.path),'utf8'));
  assert(glossary.sourceSha256===member.source.sha256,'Glossary source mismatch');
  for(const file of glossary.sourceScripts){const observed=await binding(file.path);assert(observed.sha256===file.sha256&&observed.bytes===file.bytes,'Glossary script changed');}
  const root=process.env.HELP_MATH_G678_SOURCE_ROOT;assert(root&&path.isAbsolute(root),'Source root required');
  const source=await binding(path.join(root,member.source.path));assert(source.sha256===member.source.sha256&&source.bytes===member.source.bytes,'Source changed');
  assert(bundle.frameCount===member.sourceStateMachine.frameCount&&bundle.frameBodyIndices.length===bundle.frameCount,'Main domain not complete');
  for(const file of receipt.files){const b=await binding(path.join(base,file.path));assert(b.sha256===file.sha256&&b.bytes===file.bytes,`Run drift: ${b.path}`);}
  let explanation=null;
  if(Number(suffix)>=40){
   const ep=`work/g678-shared-page-factory/g678-alg-l11-b-guided-explanation-vectors-v1/${id}/explanation-bundle.json`;
   const e=JSON.parse(await readFile(path.join(ROOT,ep),'utf8'));
   assert(e.sourceSha256===member.source.sha256&&e.branches.length===2,'Wrong explanation source');
   explanation={bundle:await binding(ep),receipt:await binding(ep.replace('explanation-bundle.json','run-receipt.json')),
    sourceFrames:e.branches.reduce((n,b)=>n+b.frameBodies.length,0),branches:e.branches.map(b=>({mainFrame:b.mainFrame,spriteId:b.spriteId,name:b.name,stopFrame:15,closeStartFrame:16,resetFrame:20}))};
  }
  records.push({animationId:id,source:member.source,vectorBundle:await binding(bundleFile),pageReceipt:await binding(`${base}/page-receipt.json`),
   mainFrames:bundle.frameCount,preQuizFrames:bundle.quizFrame-1,postQuizFrames:bundle.frameCount-bundle.quizFrame,
   sourceChoices:4,sourceHelp:true,explanation,glossary:{binding:glossaryBinding,controlRanges:glossaryMember.controlRanges,
    surfaces:glossaryMember.surfaces,termIds:glossaryMember.termIds},emptySourceGuidedHits:bundle.unresolvedGuidedControls??[]});
 }
 const maintained=['scripts/build-g678-alg-l11-b-instructional-visuals.mjs','scripts/lib/g678-alg-l11-b-source-vectors.py',
  'scripts/lib/g678-alg-l11-b-source-vectors.test.py','scripts/build-g678-alg-l11-b-guided-explanation-vectors.py',
  'packages/demos/src/g678-alg-l11-b-instructional-visuals.tsx','packages/demos/tests/g678-alg-l11-b-instructional-visuals.test.tsx',
  'scripts/build-g678-alg-l11-b-source-feedback.mjs','packages/demos/src/g678-alg-l11-b-source-feedback.generated.ts',
  'scripts/build-g678-alg-l11-b-source-glossary.mjs','scripts/build-g678-alg-l11-b-source-glossary.py',
  'scripts/build-g678-alg-l11-b-nested-help-close.py','packages/demos/src/g678-alg-l11-b-nested-help-close.generated.ts',
  'scripts/finalize-g678-alg-l11-b-instructional-visuals.mjs'];
 const imageRoot='work/g678-shared-page-factory/g678-alg-l11-b-visual-review-v3';
 const previews=await Promise.all((await readdir(path.join(ROOT,imageRoot))).filter(x=>x.endsWith('.png')).sort().map(x=>binding(`${imageRoot}/${x}`)));
 return {schemaVersion:1,artifactType:'g678-alg-l11-b-instructional-visual-successor-v4',
  status:'unregistered-source-vector-successor-awaiting-browser-and-product-review',sourceAudit:await binding(AUDIT),
  maintainedFiles:await Promise.all(maintained.map(binding)),members:records,
  mountedRuntimeQa:{evidence:await binding(mountedPath),cases:14,passed:14,
    actualBrowserWallClockCases:mounted.records.filter(r=>r.clock==='actual browser wall clock').map(r=>r.animationId),
    orderedVirtualClockCases:mounted.records.filter(r=>r.clock==='Playwright deterministic virtual clock').length,
    reducedMotionCases:mounted.records.filter(r=>r.motion==='reduce').length,
    actualAnimationRuntime:true,actualMemoryOnlyHost:true,explicitUnregisteredTestLoader:true,canonical377Evidence:false,
    productCalibrationPassed:false},
  mountedProductFixes:{feedbackHostIndex:'TI source fixed Feed4; TS maintained deterministic selection converted to host1-based IDs',
    reducedMotion:'source quiz-frame target clamped through real guided-stop chain',
    replay:'explicit supported Replay control performs allowed host reset before runtime remount',
    guidedHelpClose:'source-nested close button polygons supplied by separate generated exact-source binding',
    nestedHelpReceipt:await binding(nestedHelpPath)},
  sourceGlossary:{manifest:await binding(`${glossaryRoot}/manifest.json`),entries:await binding(`${glossaryRoot}/entries.json`),
    ...glossaryManifest.counts,alreadyInSimpleGlossaryIds:glossaryEntries.alreadyInL11SimpleGlossary,
    additionalSourceResolvedIds:glossaryEntries.additionalSourceResolvedIds,
    input:'source glyph/button placement and source KeyAttribute',mouseAndKeyboardControls:true,
    pausesWithProductHost:true,descriptorEntryMergeStillRequired:true,actualBrowserLifecycleVerified:true,
    browserLifecycleScope:'mounted AnimationRuntime test-loader; not admitted lesson descriptor'},
  rendering:{mainTimelinePages:10,mainFrames:records.reduce((n,r)=>n+r.mainFrames,0),sourceChoiceOptions:40,sourceHelpPanes:10,
   guidedExplanationDomains:6,guidedExplanationFrames:records.reduce((n,r)=>n+(r.explanation?.sourceFrames??0),0),
   vectorBundleBytes:records.reduce((n,r)=>n+r.vectorBundle.bytes+(r.explanation?.bundle.bytes??0),0),previews},
  sourceSemanticCorrections:[{animationId:'shared-alg001-l11-p030',sourceQuizFrame:63,
   supersededAuditSemanticAnswer:'|x| < 5',sourceVisibleAnswer:'|x| ≤ 5',sourceVisibleLabel:'C',
   sourceGraph:{leftBoundary:-5,rightBoundary:5,bothBoundariesClosed:true},
   evidence:'Original glyph paths and closed endpoint shapes in the source-derived frame63; reviewed PNG included.',
   frozenPredecessorAuditChanged:false,maintainedStateCorrectLabelStill:'C'}],
  maintainedAdapterDivergences:[{scope:['shared-alg001-l11-p040','shared-alg001-l11-p041','shared-alg001-l11-p042'],
   kind:'accessible-continuation-for-authored-empty-sprite-hit',sourceFinding:'Single-frame source sprite has only ShowFrame and no hit geometry; no source draw/attach/hitArea recovery in the audited main scripts.',
   sourceConsequence:'_global.quizSection=false; _parent.play();',
   implementation:'Visible keyboard-accessible Continue control only where the current guided stop has no nonempty source continuation polygon.',
   polygonClaim:'maintained product control, no source-derived polygon claimed',productCalibrationPassed:false}],
  remainingProductGaps:['decorative source feedback sprite animations remain represented by source-specific WrongFeed text and maintained modern success/host feedback',
   'source glossary controls passed mounted-runtime QA; source-resolved glossary entries still need descriptor admission and full My Lesson verification',
   'source script visibility between guided stops remains a source-fidelity comparison gate separate from mounted interaction QA',
   'source audio cue synchronization and listening remain separate and unaccepted'],
  acceptanceEffects:{registered:false,productCalibrationPassed:false,browserProductQa:false,authoritativeOriginalRuntime:false,
   visualFidelityAccepted:false,audioAccepted:false,humanVisualAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
}
const value=await build(),expected=JSON.stringify(value,null,2)+'\n';
if(process.argv.includes('--check'))assert(await readFile(path.join(ROOT,OUT),'utf8')===expected,'Successor manifest drift');
else await writeFile(path.join(ROOT,OUT),expected,{flag:'wx'});
console.log(JSON.stringify({manifest:await binding(OUT),rendering:{...value.rendering,previews:value.rendering.previews.length},acceptanceEffects:value.acceptanceEffects}));
