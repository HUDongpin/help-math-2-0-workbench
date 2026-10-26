import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,chmodSync,rmSync,symlinkSync} from 'node:fs';
import path from 'node:path';
import {resolveTypographyHostClosurePins,TYPOGRAPHY_HOST_SUCCESSOR,TYPOGRAPHY_CSS_GAP_SUCCESSOR,currentTypographyHostBinding,typographyHostFingerprintPaths} from '../lib/g678-typography-host-successor.server';
import {readG678P044PhysicalPin} from '../lib/g678-nms-l01-p044-authority.server';
import {prepareG678LessonTypography} from '../lib/g678-lesson-typography-presentation';
import {lessonTypographyLanguages} from '../lib/lesson-typography-policy';
import type {AnimationModule} from '../../../packages/demos/src/contract';
const R=path.resolve(process.cwd(),'../..'),manifest=JSON.parse(readFileSync(path.join(R,TYPOGRAPHY_HOST_SUCCESSOR.path),'utf8'));
process.env.HELP_MATH_G678_CALIBRATION_PHASE='frozen16-continuous-audio-provisional-browser-qa';
const originals=manifest.physicalReplacements.map((r:any)=>r.original);
function fixture(){const root=mkdtempSync('/private/tmp/g678-host-successor-');for(const pin of[TYPOGRAPHY_HOST_SUCCESSOR,manifest.sourceIntegration,...manifest.currentSharedFiles,...manifest.physicalReplacements.map((r:any)=>r.witness),manifest.predecessorManifest,manifest.toolbarZoomDelta.witness,manifest.toolbarZoomDelta.appended]){const f=path.join(root,pin.path);mkdirSync(path.dirname(f),{recursive:true});writeFileSync(f,pin.path===manifest.toolbarZoomDelta.current.path?Buffer.concat([readFileSync(path.join(R,manifest.toolbarZoomDelta.witness.path)),readFileSync(path.join(R,manifest.toolbarZoomDelta.appended.path))]):readFileSync(path.join(R,pin.path)));if(pin.path.includes('/predecessor/')||pin.path===manifest.toolbarZoomDelta.witness.path||pin.path===manifest.toolbarZoomDelta.appended.path)chmodSync(f,0o444);}return root;}
function verify(root:string,pins=originals){return resolveTypographyHostClosurePins(root,pins).map(p=>readG678P044PhysicalPin(root,p));}
function withFixture(fn:(root:string)=>void){const root=fixture();try{fn(root);}finally{rmSync(root,{recursive:true,force:true});}}
function withCurrentCssFixture(fn:(root:string)=>void){const root=fixture();try{writeFileSync(path.join(root,'apps/web/app/globals.css'),readFileSync(path.join(R,'apps/web/app/globals.css')));const pin=TYPOGRAPHY_CSS_GAP_SUCCESSOR,file=path.join(root,pin.path);mkdirSync(path.dirname(file),{recursive:true});writeFileSync(file,readFileSync(path.join(R,pin.path)));fn(root);}finally{rmSync(root,{recursive:true,force:true});}}
test('exact successor binds both preserved old host bytes and every new shared dependency',()=>withFixture(root=>{
 assert.throws(()=>originals.map((p:any)=>readG678P044PhysicalPin(root,p)),/physical drift/);
 const expanded=resolveTypographyHostClosurePins(root,originals);assert.equal(expanded.length,36);assert.equal(verify(root).length,36);assert.deepEqual(currentTypographyHostBinding(root),TYPOGRAPHY_HOST_SUCCESSOR);
 for(const pair of manifest.physicalReplacements){assert(expanded.some(p=>p.path===pair.witness.path&&p.sha256===pair.original.sha256));assert(expanded.some(p=>p.path===pair.current.path&&p.sha256===pair.current.sha256));}
 assert.equal(typographyHostFingerprintPaths(root).length,36);
}));
test('CSS gap successor retains v3 witnesses and admits only the exact mobile header delta',()=>withCurrentCssFixture(root=>{
 const expanded=resolveTypographyHostClosurePins(root,originals);
 assert.equal(expanded.length,37);assert.equal(verify(root).length,37);
 assert.deepEqual(currentTypographyHostBinding(root),TYPOGRAPHY_CSS_GAP_SUCCESSOR);
 assert.equal(typographyHostFingerprintPaths(root).length,37);
 assert.equal(expanded.find(pin=>pin.path==='apps/web/app/globals.css')?.sha256,
   'faa54056875409e4c283f89b4af4579ac050a38f8bcd419764ce18f582f32cbc');
 const stylesheet=path.join(root,'apps/web/app/globals.css'),bytes=readFileSync(stylesheet);
 writeFileSync(stylesheet,Buffer.concat([bytes,Buffer.from('\n')]));
 assert.throws(()=>verify(root),/toolbar pin apps\/web\/app\/globals.css/);
 writeFileSync(stylesheet,bytes);
 const successor=path.join(root,TYPOGRAPHY_CSS_GAP_SUCCESSOR.path);
 writeFileSync(successor,Buffer.concat([readFileSync(successor),Buffer.from('\n')]));
 assert.throws(()=>verify(root),/toolbar pin .*css-gap-successor-v4.json/);
}));
test('tampered current runtime, semantic contract, font or CSS cannot hide behind preserved witnesses',()=>{
 for(const relative of['apps/web/components/animation-runtime.tsx','packages/demos/src/contract.ts','apps/web/public/fonts/lesson-v1/fredoka-variable.ttf','apps/web/app/lesson-typography.css'])withFixture(root=>{const f=path.join(root,relative);writeFileSync(f,Buffer.concat([readFileSync(f),Buffer.from('drift')]));assert.throws(()=>verify(root),/physical drift/);});
});
test('a historical witness must remain exact, ordinary and read-only',()=>{
 withFixture(root=>{const f=path.join(root,manifest.physicalReplacements[0].witness.path);chmodSync(f,0o644);assert.throws(()=>verify(root),/read-only historical witness/);});
 withFixture(root=>{const f=path.join(root,manifest.physicalReplacements[0].witness.path);chmodSync(f,0o644);writeFileSync(f,'changed');chmodSync(f,0o444);assert.throws(()=>verify(root),/physical drift/);});
 withFixture(root=>{const f=path.join(root,manifest.physicalReplacements[0].witness.path);rmSync(f);symlinkSync(path.join(root,originals[0].path),f);assert.throws(()=>verify(root),/ordinary single-linked physical file|read-only historical witness/);});
});
test('incomplete caller closure or an unrecognized old digest is rejected',()=>withFixture(root=>{
 assert.throws(()=>verify(root,originals.slice(0,1)),/complete existing host closure/);assert.throws(()=>verify(root,[{...originals[0],sha256:'0'.repeat(64)},originals[1]]),/exact historical caller binding/);
 assert.throws(()=>verify(root,[...originals,originals[0]]),/exact historical caller binding/);
}));
test('changing the successor manifest fails before any mapping is selected',()=>withFixture(root=>{const f=path.join(root,TYPOGRAPHY_HOST_SUCCESSOR.path);writeFileSync(f,readFileSync(f,'utf8')+' ');assert.throws(()=>verify(root),/manifest bytes/);}));
test('absence and a predecessor phase retain the original strict closure',()=>withFixture(root=>{
 const previous=process.env.HELP_MATH_G678_CALIBRATION_PHASE;try{process.env.HELP_MATH_G678_CALIBRATION_PHASE='old-predecessor';assert.equal(resolveTypographyHostClosurePins(root,originals),originals);assert.equal(currentTypographyHostBinding(root),null);assert.throws(()=>verify(root),/physical drift/);}finally{process.env.HELP_MATH_G678_CALIBRATION_PHASE=previous;}
 rmSync(path.join(root,TYPOGRAPHY_HOST_SUCCESSOR.path));assert.equal(resolveTypographyHostClosurePins(root,originals),originals);assert.throws(()=>verify(root),/physical drift/);
}));
test('source capture and existing modules preserve object identity without typography preparation',async()=>{
 const old={key:'shared-nms002-l01-p044',authoredTimelineControls:[{id:'source-control'}],interactiveStops:[{id:'source-stop'}],Renderer:()=>null}as unknown as AnimationModule;assert.equal(await prepareG678LessonTypography(old,false),old);assert.equal(await prepareG678LessonTypography(undefined,false),undefined);
 let calls=0;const capture={...old,textPresentation:{prepare:()=>{calls++;throw Error('must not prepare in evidence capture');}}}as unknown as AnimationModule;assert.equal(await prepareG678LessonTypography(capture,true),capture);assert.equal(calls,0);
});
test('native presentation awaits preparation and rejects unsupported host extensions',async()=>{
 let prepared=false;const module={key:'shared-nms002-l01-p047',movie:{frameCount:10},runtime:{frameCount:10,frameDomains:[{id:'sprite-1024',frameCount:74}]},textPresentation:{schemaVersion:1,binding:{animationId:'shared-nms002-l01-p047',version:'source-v1',sourceSwfSha256:'a'.repeat(64),blocks:[{language:'en'}]},Renderer:()=>null,getSnapshot:()=>({}),reducedMotionFrameByDomain:{'sprite-1024':2},prepare:async()=>{prepared=true;}}}as unknown as AnimationModule;
 assert.equal(await prepareG678LessonTypography(module,false),module);assert(prepared);
 for(const field of['frameControl','completion','keyTerms','activityTimelines','sourceTimelineAudioCues']){const bad={...module,textPresentation:{...module.textPresentation,[field]:field.endsWith('Timelines')||field.endsWith('Cues')?[{}]:{}}}as unknown as AnimationModule;await assert.rejects(prepareG678LessonTypography(bad,false),/existing G678 source host contracts/);}
 await assert.rejects(prepareG678LessonTypography({...module,textPresentation:{...module.textPresentation,reducedMotionFrameByDomain:{'sprite-1024':75}}}as AnimationModule,false),/outside its source timeline/);
});
test('Spanish entry with English source text stays an explicit fallback; old modules keep requested language',()=>{
 assert.deepEqual(lessonTypographyLanguages('es','es',undefined),{requestedLanguage:'es',visualLanguage:'es',uiLanguage:'es',usesEnglishFallback:false});
 assert.deepEqual(lessonTypographyLanguages('es','es',{blocks:[{language:'en'}]}),{requestedLanguage:'es',visualLanguage:'en',uiLanguage:'es',usesEnglishFallback:true});
});
