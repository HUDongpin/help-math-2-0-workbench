#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {mkdir, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {promisify} from 'node:util';
import {ROOT, ID, SOURCE, FALSE_GATES, file, desc, hash, json} from './g678-nms-l01-p042-extract-source.mjs';
import {build as verifyBase} from './g678-nms-l01-p042-build-candidate-manifest.mjs';
export const OUT = 'catalog/g678-nms-l01-p042-readable-companion-candidate-v1.json';
const VALIDATION = 'work/g678-shared-page-factory/g678-nms-l01-p042-readable-companion-validation-v1';
const BASE = {path:'catalog/g678-nms-l01-p042-candidate-v1.json',bytes:73582,
  sha256:'4923ae74bfecc6659d338ff805f9891e956ac6736c91f612628da74a8bd493f5'};
const MODULE = {path:'packages/demos/src/g678-nms-l01-p042-readable-companion-candidate.tsx',bytes:5586,
  sha256:'00eb033df4f1b31d9f7065471c8df6255154107aec449adc470f65634230f66a'};
const EVIDENCE = {path:'output/playwright/g678-nms-l01-p042-readable-mounted-v1/evidence.json',bytes:745281,
  sha256:'624a92889adad7634fadc9fe67ae5f8627b3e98ac5a57ed5cfbb708f02e4b779'};
const TESTS = ['packages/demos/tests/g678-nms-l01-p042-readable-companion-candidate.test.tsx',
  'scripts/g678-nms-l01-p042-build-readable-companion-manifest.test.mjs','scripts/qa-g678-nms-l01-p042-readable-mounted.test.mjs'];
export function validateReadableBoundary(evidence) {
  assert.equal(evidence.status,'passed'); assert.equal(evidence.inputsUnchanged,true);
  assert.deepEqual(evidence.inputsAfter,evidence.inputs);
  assert.equal(evidence.registered,false); assert.equal(evidence.actualMyLesson,false);
  for(const key of ['productCalibrationPassed','sourceAudioIntegrated','audioAccepted','authoritativeOriginalRuntime',
    'visualFidelityAccepted','humanVisualAccepted','ownerAccepted','strictComplete','released','published'])assert.equal(evidence[key],false);
  assert.deepEqual(evidence.records.map(record=>record.name),['1440-natural','390-natural','370-reduced','844-landscape',
    '390-text200','390-zoom-reflow-emulation200','390-target-lifecycle']);
  for(const record of evidence.records){assert.equal(record.status,'passed');assert.deepEqual(record.errors,[]);assert.deepEqual(record.requests,[]);}
}
export function validateReadableMeasurements(evidence,literals){
  const luminance=rgb=>rgb.match(/[0-9.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  for(const record of evidence.records){
    assert.ok(record.readable.length>0 && record.geometry.length>0);assert.ok(record.screenshots.length>=3);
    for(const snapshot of record.readable){assert.equal(snapshot.items.length,2);
      for(const item of snapshot.items){assert.equal(item.contents,1);assert.equal(item.roots,1);assert.equal(item.language,'en');
        assert.equal(item.sourceAriaHidden,'true');assert.equal(item.insideSourcePlane,false);assert.equal(item.controls,0);
        assert.equal(item.orderedLists,1);assert.equal(item.labelledBy,item.headingId);assert.equal(item.duplicateNativeIds,0);
        assert.deepEqual(item.text.map(t=>t.text),literals.map(t=>t.literal));
        assert.deepEqual(item.text.slice(1).map(t=>t.sourceCharacterId),['16','18','20','22']);
        const a=luminance(item.foreground),b=luminance(item.background);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
        assert.ok(item.source.bottom<=item.content.top+1||item.content.bottom<=item.source.top+1);
        for(const text of item.text){assert.ok(text.fontSize>=20 && text.lineHeight>=text.fontSize*1.5-.1);
          assert.deepEqual(text.clips,[]);assert.ok(text.box.width>0 && text.box.height>0);assert.ok(text.scrollWidth<=text.clientWidth+1);}
      }
    }
    for(const g of record.geometry){assert.deepEqual(g.duplicateIds,[]);assert.deepEqual(g.badReferences,[]);assert.equal(g.mediaElements,0);
      assert.ok(g.documentWidth<=g.viewport+1);assert.equal(g.figures.length,2);}
    assert.equal(record.final.frame,125);assert.equal(record.final.requests,0);
    if(record.motion==='no-preference'){
      assert.deepEqual(record.firstNaturalClock.actuallyObservedFrames,Array.from({length:125},(_,i)=>i+1));
      assert.ok(record.firstNaturalClock.activeMs>=10000 && record.firstNaturalClock.activeMs<=12000);
    }
  }
  const lifecycle=evidence.records.find(record=>record.kind==='lifecycle');
  const labels=lifecycle.readable.map(snapshot=>snapshot.label);
  for(const key of ['unmarked','button','duplicate','outside','missing','wrong-id']){
    assert.ok(labels.includes(`target-${key}`)&&labels.includes(`target-restored-after-${key}`));
  }
  for(const label of ['without-id','restored-id','without-column','restored-column','modal-closed','actual-runtime-remount'])assert.ok(labels.includes(label));
  const modal=lifecycle.lifecycle.find(item=>item.step==='modal-inert-stays-portal-no-escape');
  assert.equal(modal.inert,true);assert.equal(modal.hidden,true);
}
async function dependency(pin) {
  const canonicalPath=await realpath(path.resolve(ROOT,pin.path)), observed=await file(canonicalPath);
  assert.deepEqual({...desc(observed),path:pin.path},pin);return{...pin,canonicalPath};
}
export async function build({check=false}={}) {
  await file(BASE.path,BASE);await verifyBase({check:true});const base=JSON.parse((await file(BASE.path,BASE)).buffer);
  await file(MODULE.path,MODULE);
  const evidenceFile=await file(EVIDENCE.path,EVIDENCE),evidence=JSON.parse(evidenceFile.buffer);validateReadableBoundary(evidence);
  const dependencies=await Promise.all(evidence.inputs.map(dependency));
  const screenshots=[];
  for(const record of evidence.records)for(const shot of record.screenshots)screenshots.push(desc(await file(shot.path,shot)));
  const paths=[MODULE.path,...TESTS,'packages/demos/tsconfig.json',path.relative(ROOT,fileURLToPath(import.meta.url)),
    'scripts/g678-nms-l01-p042-extract-source.mjs','scripts/g678-nms-l01-p042-build-candidate-manifest.mjs'];
  const codeDependencyClosure=await Promise.all([...new Set(paths)].sort().map(async p=>desc(await file(p))));
  const dump=await promisify(execFile)(process.execPath,['--import','tsx','--input-type=module','-e',
    `import{G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE as m,G678_NMS_L01_P042_READABLE_COMPANION_CONFIG as config}from'./${MODULE.path}';import{G678_NMS_L01_P042_CANDIDATE_MODULE as b}from'./${base.module.path}';const{Renderer,getFrameState,...metadata}=m;console.log(JSON.stringify({config,metadata,baseIdentityExceptRenderer:Object.keys(b).filter(k=>k!=='Renderer').every(k=>m[k]===b[k])}));`],{cwd:ROOT});
  assert.equal(dump.stderr,'');const actualModule=JSON.parse(dump.stdout);
  assert.equal(actualModule.baseIdentityExceptRenderer,true);assert.deepEqual(actualModule.metadata,base.actualModule.metadata);
  assert.equal(actualModule.config.pageInteractionCompanionTargetIdSuffix,'nms-l01-p042-readable-companion');
  assert.equal(actualModule.config.sourceSwfSha256,SOURCE.sha256);
  const visualRun=JSON.parse((await file(base.sourceVisualRun.path,base.sourceVisualRun)).buffer);
  const sourceLiterals=visualRun.texts;
  assert.deepEqual(sourceLiterals.map(item=>item.characterId),actualModule.config.sourceLiteralCharacterIds);
  for(const literal of sourceLiterals)await file(literal.source.path,literal.source);
  validateReadableMeasurements(evidence,sourceLiterals);
  const fixture=await file(path.join(path.dirname(EVIDENCE.path),'fixture-bundle.js'));
  assert.deepEqual({bytes:fixture.bytes,sha256:fixture.sha256},evidence.fixture);
  if(!check){await mkdir(path.join(ROOT,VALIDATION));const results=[];
    for(const[label,args]of[['units',['--import','tsx','--test',...TESTS]],
      ['demos-typecheck',['node_modules/typescript/bin/tsc','--noEmit','-p','packages/demos/tsconfig.json']]]){
      const result=await promisify(execFile)(process.execPath,args,{cwd:ROOT,encoding:'buffer',maxBuffer:8*1024*1024}).catch(async error=>{
        for(const key of ['stdout','stderr'])await writeFile(path.join(ROOT,VALIDATION,`${label}.failed.${key}`),error[key]??'',{flag:'wx'});throw error;});
      assert.equal(result.stderr.length,0);const output={};
      for(const key of ['stdout','stderr']){const p=`${VALIDATION}/${label}.${key}`;await writeFile(path.join(ROOT,p),result[key],{flag:'wx',mode:0o444});output[key]=desc(await file(p));}
      const passed=label==='units'?Number(result.stdout.toString().match(/\bpass (\d+)\b/)?.[1]):null;
      if(label==='units'){assert.ok(passed>=6);assert.match(result.stdout.toString(),/\bfail 0\b/);}
      results.push({command:[process.execPath,...args],exitCode:0,passed,...output});
    }
    await writeFile(path.join(ROOT,VALIDATION,'validation.json'),json({codeDependencyClosure,dependencies,results}),{flag:'wx',mode:0o444});
  }
  const validationFile=await file(`${VALIDATION}/validation.json`),validation=JSON.parse(validationFile.buffer);
  assert.deepEqual(validation.codeDependencyClosure,codeDependencyClosure);assert.deepEqual(validation.dependencies,dependencies);
  for(const result of validation.results){assert.equal(result.exitCode,0);for(const key of ['stdout','stderr'])await file(result[key].path,result[key]);}
  assert.deepEqual(await Promise.all(evidence.inputs.map(dependency)),dependencies);
  for(const pin of codeDependencyClosure)await file(pin.path,pin);await file(BASE.path,BASE);
  const flatBindings=[BASE,MODULE,EVIDENCE,...codeDependencyClosure,...dependencies.map(({canonicalPath,...pin})=>pin),
    base.sourceExtraction,base.sourceVisualRun,...sourceLiterals.map(literal=>literal.source),...screenshots,desc(validationFile),
    ...validation.results.flatMap(result=>[result.stdout,result.stderr]),desc(fixture)];
  const files=[...new Map(flatBindings.map(pin=>[pin.path,pin])).values()].sort((a,b)=>a.path.localeCompare(b.path));
  for(const pin of files)await dependency(pin);
  const manifest={schemaVersion:1,artifactType:'g678-nms-l01-p042-readable-companion-unregistered-candidate',
    candidateId:'g678-nms-l01-p042-readable-companion-candidate-v1',animationId:ID,gradeScope:'G6-G8-shared',source:SOURCE,
    baseCandidateManifest:BASE,module:MODULE,moduleExport:'G678_NMS_L01_P042_READABLE_COMPANION_CANDIDATE_MODULE',actualModule,files,codeDependencyClosure,
    sourceLiterals,sourceVisualRun:base.sourceVisualRun,sourceAudio:base.sourceAudio,
    presentation:{pageInteractionCompanionTargetIdSuffix:actualModule.config.pageInteractionCompanionTargetIdSuffix,
      nativeStepFontPx:20,lineHeight:1.5,stepGapPx:8,noninteractive:true,sourceVisualRetained:true,
      accessibleContentRepresentations:1,explicitLanguage:'en',sourceFigureSemanticallyHiddenOnlyWithEquivalentContent:true,
      portalPolicy:'Exact unique marked HTML DIV, direct child of same nearest native learning column; missing/wrong/duplicate/moved/disconnected targets use one fallback.',
      modalPolicy:'Portal remains in existing host slot and native inert/aria-hidden subtree; never portals to body or outside owning column.',
      fallbackScope:'Normal-flow engineering fallback, not an admitted My Lesson descriptor.'},
    validation:{receipt:desc(validationFile),unitTestsPassed:validation.results.find(result=>result.passed!==null).passed,demosTypecheckPassed:true,
      mountedEvidence:EVIDENCE,mountedRecordsPassed:evidence.records.length,inputBindingScope:evidence.inputBindingScope,dependencies,screenshots,compiledFixture:desc(fixture),
      enlargedTextBoundary:evidence.enlargementBoundary},
    limitations:['Unregistered candidate; no product route/descriptor/bridge/registry change.',
      'Readable English literal companion is a product adaptation, not an original-runtime source visual claim.',
      'Full source art remains visually unchanged, including its small scaled glyphs and original title contrast.',
      'No source audio delivery, new controls, score or instructional examples were added.',
      'Browser/semantic checks are not named-human screen-reader, original-runtime, human/Owner or release acceptance.'],
    gates:{...FALSE_GATES,registeredMyLessonBrowserQa:false,screenReaderHumanAccepted:false}};
  const bytes=json(manifest);if(check)assert.equal((await file(OUT)).buffer.toString(),bytes);
  else await writeFile(path.join(ROOT,OUT),bytes,{flag:'wx',mode:0o444});
  return{check,path:OUT,bytes:Buffer.byteLength(bytes),sha256:hash(bytes),mountedRecords:evidence.records.length,gates:manifest.gates};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);assert.ok(args.length<=1&&(!args.length||args[0]==='--check'));
  console.log(json(await build({check:args[0]==='--check'})));
}
