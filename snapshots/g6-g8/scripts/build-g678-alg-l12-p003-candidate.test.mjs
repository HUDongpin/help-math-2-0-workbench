import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {Script, createContext} from 'node:vm';
import test from 'node:test';
import {validateP003Runtime} from './validate-g678-alg-l12-p003-runtime.mjs';
import {composeP003Definitions} from './build-g678-alg-l12-p003-candidate.mjs';

const root = new URL('../',import.meta.url);
const base = new URL('migrations/shared-alg001-l12-p003/',root);
const runtime = readFileSync(new URL('candidate-v1/canvas-renderer.js',base),'utf8');
test('P003 builder reproduces every candidate output',()=>{
  const run=spawnSync(process.execPath,[fileURLToPath(new URL('./build-g678-alg-l12-p003-candidate.mjs',import.meta.url)),'--check'],{
    cwd:root,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'},encoding:'utf8',timeout:30000});
  assert.equal(run.status,0,run.stderr);
});
test('P003 composition refuses source declaration conflicts',()=>{
  const get=p=>readFileSync(new URL('audit/ffdec-26.2.1-canvas-v1/'+p,base),'utf8').replace(/\r\n?/g,'\n');
  const main=get('sprites/DefineSprite_164/frames.html'), sourceRoot=get('frames/frames.html');
  assert(composeP003Definitions(main,sourceRoot).includes('function sprite166('));
  assert.throws(()=>composeP003Definitions(main,sourceRoot.replace('function font1(','function changedFont1(')));
});
test('P003 runtime permits only one embedded JPEG and rejects active browser primitives',()=>{
  validateP003Runtime(runtime);
  for(const extra of ['fetch("/")','setTimeout(()=>{},0)','document.body','eval("1")','document.createElement("img")']) assert.throws(()=>validateP003Runtime(runtime+'\n'+extra));
  assert.throws(()=>validateP003Runtime(runtime.replace('data:image/JPEG;base64,','https://example.invalid/')));
});
test('P003 resolves all1008frames and rejects unsupported requests without rendering',async()=>{
  const created=[];
  const context=createContext({document:{createElement(kind){created.push(kind);assert.equal(kind,'img');return {complete:true,naturalWidth:690};}}});
  const script=new Script(runtime);script.runInContext(context,{timeout:3000});
  assert.deepEqual(Object.keys(context.HELP_MATH_CANVAS_ASSETS),['shared-alg001-l12-p003']);
  const asset=context.HELP_MATH_CANVAS_ASSETS['shared-alg001-l12-p003'];
  await asset.ready();
  assert.deepEqual(created,['img']);
  for(let frame=1;frame<=1008;frame++) {
    const s=asset.resolveFrameState({frame});
    assert.equal(s.frameDomain,'sprite-164');assert.equal(s.localFrame,frame);assert.equal(s.exportFrame,frame-1);assert.equal(s.rootFrame,6);assert.equal(s.audioRendered,false);
  }
  for(const frame of [0,1009,1.5,NaN]) assert.throws(()=>asset.resolveFrameState({frame}));
  assert.throws(()=>asset.resolveFrameState({frame:1,lang:'es'}));
  assert.throws(()=>script.runInContext(context),/already registered/);
});
