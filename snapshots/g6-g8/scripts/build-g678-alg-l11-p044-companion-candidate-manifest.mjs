#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {build as verifyPredecessor} from './build-g678-alg-l11-p044-host-score-candidate-manifest.mjs';
import {build as verifyLiteralContent} from './build-g678-alg-l11-p044-literal-content.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT='catalog/g678-alg-l11-p044-companion-candidate-v1.json';
const EVIDENCE='output/playwright/g678-alg-l11-p044-companion-v2/evidence.json';
const PREDECESSOR='catalog/g678-alg-l11-p044-host-score-candidate-v1.json';
const MODULE='packages/demos/src/g678-alg-l11-p044-companion-candidate.tsx';
const VALIDATION='work/g678-shared-page-factory/g678-alg-l11-p044-companion-final-validation-v1';
const TESTS=['packages/demos/tests/g678-alg-l11-p044-host-score-candidate.test.ts','packages/demos/tests/g678-alg-l11-p044-companion-candidate.test.tsx'];
const hash=b=>createHash('sha256').update(b).digest('hex'),json=x=>JSON.stringify(x,null,2)+'\n';
async function binding(p){assert.ok(!path.isAbsolute(p)&&!p.split('/').includes('..'));const full=path.join(ROOT,p),s=await lstat(full);
  assert.ok(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1);const b=await readFile(full),after=await lstat(full);
  assert.equal(s.ino,after.ino);assert.equal(s.mtimeMs,after.mtimeMs);return{path:p,bytes:b.length,sha256:hash(b)};}
async function parse(p){return JSON.parse(await readFile(path.join(ROOT,p),'utf8'));}
export async function build({check=false}={}){
  await verifyPredecessor({check:true});await verifyLiteralContent({check:true});
  assert.equal((await binding(EVIDENCE)).sha256,'3f3f1b98ce28842907c1b0cd0adb2f90057277cf13f05b98b8b2be44e312ea96');
  const evidence=await parse(EVIDENCE);assert.equal(evidence.status,'passed');assert.equal(evidence.records.length,29);
  assert.equal(evidence.literalContentSourceMapBundled,false);const screenshots=[],geometry=[];
  for(const record of evidence.records){assert.equal(record.status,'passed');assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);assert.equal(record.final.trees,1);
    for(const screenshot of record.screenshots){assert.deepEqual(await binding(screenshot.path),screenshot);screenshots.push(screenshot);}
    for(const g of record.geometry){assert.equal(g.trees,1);assert.equal(g.sourceButtons,0);assert.equal(g.choices.length,4);assert.equal(g.duplicateSvgIds,0);
      assert.equal(g.prompt.fontSize,20);assert.ok(g.documentWidth<=g.viewport+1);assert.ok(g.gap>=8);
      for(const choice of g.choices){assert.equal(choice.literal.fontSize,20);assert.ok(choice.width>=44&&choice.height>=44);assert.ok(choice.scrollWidth<=choice.clientWidth+1);}
      geometry.push({question:g.question,viewport:g.viewport,minChoiceWidth:Math.min(...g.choices.map(c=>c.width)),minChoiceHeight:Math.min(...g.choices.map(c=>c.height)),
        promptFontPx:20,choiceFontPx:20,gap:g.gap,horizontalOverflow:false,duplicateSvgIds:0});
    }
  }
  const literalRecords=evidence.records.filter(r=>r.config.kind==='literal-24');assert.equal(literalRecords.length,24);
  assert.deepEqual(literalRecords.map(r=>r.geometry[0].question),Array.from({length:24},(_,i)=>i+1));
  assert.equal(evidence.records.filter(r=>r.config.kind==='full-score-review').length,2);
  for(const r of evidence.records.filter(r=>r.config.kind==='full-score-review')){
    assert.deepEqual(r.trace.map(t=>t.step),['blocked-record-no-local-advance','real-score-reset-before-new-quiz','ten-acks-before-completion','full-review-no-rescore-and-pause-preserved']);
    const reviewed=r.trace.at(-1).state;assert.equal(reviewed.attempted,10);assert.equal(reviewed.awarded,5);assert.equal(reviewed.completions,1);
  }
  for(const input of evidence.inputs)assert.deepEqual(await binding(input.path),input,'mounted input drift');
  const files=await Promise.all([...new Set([...evidence.inputs.map(i=>i.path),...TESTS,
    'scripts/build-g678-alg-l11-p044-companion-candidate-manifest.mjs','scripts/g678-alg-l11-p044-literal-source.py',
    'config/g678-alg-l11-p044-literal-content-v1.json','work/g678-shared-page-factory/g678-alg-l11-p044-literal-content-v1/source-projection.json',
    'work/g678-shared-page-factory/g678-alg-l11-p044-companion-svg-id-review-v1/failure.json'])].sort().map(binding));
  if(!check){await mkdir(path.join(ROOT,VALIDATION));const results=[];
    for(const[label,args]of[['unit',['--import','tsx','--test',...TESTS]],['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']]]){
      const result=await promisify(execFile)('node',args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stdout`),error.stdout??'',{flag:'wx'});await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.stderr`),error.stderr??'',{flag:'wx'});throw error;});
      await writeFile(path.join(ROOT,VALIDATION,`${label}.stdout`),result.stdout,{flag:'wx'});await writeFile(path.join(ROOT,VALIDATION,`${label}.stderr`),result.stderr,{flag:'wx'});
      if(label==='unit')assert.match(result.stdout.toString(),/pass 7\b/);results.push({command:['node',...args],exitCode:0,
        stdout:await binding(`${VALIDATION}/${label}.stdout`),stderr:await binding(`${VALIDATION}/${label}.stderr`)});
    }
    assert.deepEqual(await Promise.all(files.map(f=>binding(f.path))),files);await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({files,results}),{flag:'wx'});
  }
  const validation=await parse(`${VALIDATION}/validation.json`);assert.deepEqual(validation.files,files);
  for(const result of validation.results){assert.equal(result.exitCode,0);assert.deepEqual(await binding(result.stdout.path),result.stdout);assert.deepEqual(await binding(result.stderr.path),result.stderr);}
  const manifest={schemaVersion:1,artifactType:'g678-alg-l11-p044-literal-math-responsive-companion-candidate',candidateId:'g678-alg-l11-p044-companion-v1',
    animationId:'shared-alg001-l11-p044',module:await binding(MODULE),moduleExport:'G678_ALG_L11_P044_COMPANION_CANDIDATE_MODULE',predecessor:await binding(PREDECESSOR),files,
    literalContent:{prompts:24,choices:96,numberLineDescriptions:18,projection:await binding('packages/demos/src/generated/g678-alg-l11-p044-literal-content-v1.ts'),
      sourceMap:await binding('catalog/g678-alg-l11-p044-literal-content-source-map-v1.json'),sourceMapBundled:false,
      correctnessOrSolvedQuestionMetadataInLiteralProjection:false,existingSourceAnswerKeyRetainedForScoring:true,visibleFormat:'literal Unicode and source-diagram descriptions',spokenLanguage:'en'},
    presentation:{sourcePlane:{width:800,height:600,sourcePromptChoiceArtRetained:true,reviewVisualStatesRetained:true,actionableControls:0},
      companionContract:'pageInteractionCompanionTargetId + data-page-interaction-companion-host=true',controllerCount:1,actionableTreeCount:1,
      mathFontPx:20,minControlHeightPx:48,minChoiceHeightPx:64,gapPx:8,focusOutlinePx:3,standaloneFallback:true,lateRemovedInvalidTargetStatePreserved:true,
      svgDisplayInstanceIds:'React instance namespace, internal IDs/references only; source geometry and asset bytes unchanged'},
    scoreBehavior:{capability:'fq-scoring',hostAcknowledgmentBeforeLocalAdvance:true,exactOrderedSelectedSourceQuestionIds:true,
      completionRequiresTenAcknowledgments:true,reviewDoesNotRecordScore:true,replayRequiresRealHostReset:true,rawAnswersInHostRequests:false},
    validation:{unitTestsPassed:7,demosTypecheckPassed:true,receipt:await binding(`${VALIDATION}/validation.json`),mountedRecordsPassed:29,
      evidence:await binding(EVIDENCE),screenshots,geometry,keyboard:['Enter','Space','Tab'],mouse:true,touch:true,boundary:evidence.boundary,
      retainedPriorRun:await binding('output/playwright/g678-alg-l11-p044-companion-v1/evidence.json'),
      retainedSvgIdRegression:await binding('work/g678-shared-page-factory/g678-alg-l11-p044-companion-svg-id-review-v1/failure.json')},
    limitations:['The actual registered My Lesson descriptor and successor registry/wrapper must still select this candidate and existing companion slot.',
      'English literal labels and machine accessibility snapshots are not named-human screen-reader acceptance; Spanish spoken alternatives pending.',
      'All24 prompts/96choices at375px and complete390px/desktop flows are bounded engineering checks, not original-runtime fidelity or full zoom/assistive-technology acceptance.',
      'Source audio remains pending; no invented URL, delivery or playback.',
      'Independent Q16–24 source review was agent/message-level only; no named-human receipt is claimed.'],
    gates:{successorRegistered:false,registeredMyLessonBrowserQa:false,productCalibrationPassed:false,authoritativeOriginalRuntime:false,visualFidelityAccepted:false,
      audioIntegrated:false,audioAccepted:false,humanVisualAccepted:false,screenReaderHumanAccepted:false,ownerAccepted:false,strictComplete:false,released:false,published:false}};
  const bytes=json(manifest);if(check)assert.equal(await readFile(path.join(ROOT,OUT),'utf8'),bytes);else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx'});
  console.log(json({check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),unitTests:7,mountedRecords:29}));return manifest;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build({check:process.argv.includes('--check')});
