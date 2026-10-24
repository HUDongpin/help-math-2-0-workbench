import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {P010_LESSON_CANVAS_RESOURCES,P010_LESSON_CANVAS_ORIGINAL_PATHS,
  P010_LESSON_CANVAS_BRIDGE_PATHS,p010LessonCanvasResourceForRequest,
  isP010LessonCanvasOriginalRequest,type P010LessonCanvasId}
  from '../lib/alg-l06-p010-lesson-canvas-request-v1';
import * as production from '../lib/alg-l06-p010-lesson-canvas-request-production-v1';

const root=fileURLToPath(new URL('../../../',import.meta.url));
const origin='http://127.0.0.1:3331';
const env={NODE_ENV:'development',HELP_MATH_G678_LOCAL_PREVIEW:'1',
  HELP_MATH_G678_LOCAL_PREVIEW_BIND:'127.0.0.1',
  HELP_MATH_G678_SOURCE_ROOT:'/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware'};
const ids=Object.keys(P010_LESSON_CANVAS_RESOURCES) as P010LessonCanvasId[];
function request(id:P010LessonCanvasId,choice:{path?:'originalPath'|'bridgePath';
  locale?:'en'|'es';version?:'candidate-v1'|'continuous-v1';focus?:boolean}={}){
  const pin=P010_LESSON_CANVAS_RESOURCES[id];
  const path=pin[choice.path??'originalPath'];
  const referer=`${origin}/${choice.locale??'en'}/migration-status/g678-calibration/shared-alg001-l06-p010/${choice.version??'candidate-v1'}${choice.focus?'?mode=focus':''}`;
  return {method:'GET',url:new URL(`${origin}${path}?sha256=${pin.sha256}`),
    headers:new Headers({host:'127.0.0.1:3331',referer,
      'sec-fetch-site':'same-origin','sec-fetch-mode':'no-cors','sec-fetch-dest':'script'})};
}

test('exact P008 formal Canvas subset has current registry and source-file pins',()=>{
  const expected=[2,5,6,7,9,11,12,30,36,37,39,40,51,52,53,54,55,59]
    .map(n=>`shared-alg001-l06-p${String(n).padStart(3,'0')}`);
  assert.deepEqual(ids,expected);
  assert.equal(new Set(P010_LESSON_CANVAS_ORIGINAL_PATHS).size,18);
  assert.equal(new Set(P010_LESSON_CANVAS_BRIDGE_PATHS).size,18);
  const registry=JSON.parse(readFileSync(path.join(root,'packages/demos/private-current-js-registry.json'),'utf8'));
  for(const id of ids){
    const pin=P010_LESSON_CANVAS_RESOURCES[id];
    const matches=registry.calibrations.flatMap((calibration:{deploymentScope:string;
      entries:Array<{key:string;maturity:string;artifacts:{runtime?:unknown}}>})=>
      calibration.entries.filter(entry=>entry.key===id).map(entry=>({calibration,entry})));
    assert.equal(matches.length,1,id);
    assert.equal(matches[0].calibration.deploymentScope,'local-only');
    assert.equal(matches[0].entry.maturity,'private-current-js');
    assert.deepEqual(matches[0].entry.artifacts.runtime,
      {path:pin.path,bytes:pin.bytes,sha256:pin.sha256});
    assert.equal(pin.originalPath,`/flash-assets/g678-local/${id}/canvas-renderer.js`);
    assert.equal(pin.bridgePath,
      `/flash-assets/g678-local/shared-alg001-l06-p010/lesson-canvas/${id}`);
    const bytes=readFileSync(path.join(root,pin.path));
    assert.equal(bytes.length,pin.bytes,id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),pin.sha256,id);
  }
  for(const excluded of ['p001','p003','p004','p008','p010','p013'])
    assert.equal(Object.hasOwn(P010_LESSON_CANVAS_RESOURCES,`shared-alg001-l06-${excluded}`),false);
});

test('P010 EN/ES candidate and continuous documents may read only exact Canvas URLs',()=>{
  for(const id of ids)for(const locale of ['en','es'] as const)
    for(const version of ['candidate-v1','continuous-v1'] as const)
      for(const focus of [false,true])for(const path of ['originalPath','bridgePath'] as const){
        const r=request(id,{locale,version,focus,path});
        assert.equal(p010LessonCanvasResourceForRequest(r,env),id);
        assert.equal(isP010LessonCanvasOriginalRequest(r,env),path==='originalPath');
      }
});

test('query, referer, origin, method, fetch and environment drift fail closed',()=>{
  const id=ids[0];
  for(const patch of [{NODE_ENV:'production'},{VERCEL:'1'},{VERCEL_ENV:'preview'},
    {HELP_MATH_G678_SOURCE_ROOT:'/tmp'},{HELP_MATH_G678_LOCAL_PREVIEW:undefined}])
    assert.equal(p010LessonCanvasResourceForRequest(request(id),{...env,...patch}),null);
  for(const value of ['?mode=focus&other=1','?other=1','?mode=other','?mode=focus#frag']){
    const r=request(id);r.headers.set('referer',r.headers.get('referer')+value);
    assert.equal(p010LessonCanvasResourceForRequest(r,env),null,value);
  }
  const wrongPage=request(id);wrongPage.headers.set('referer',
    `${origin}/en/migration-status/g678-calibration/shared-alg001-l06-p008/continuous-v1`);
  assert.equal(p010LessonCanvasResourceForRequest(wrongPage,env),null);
  const wrongHash=request(id);wrongHash.url.searchParams.set('sha256','0'.repeat(64));
  assert.equal(p010LessonCanvasResourceForRequest(wrongHash,env),null);
  const extraQuery=request(id);extraQuery.url.search+='&autoplay=1';
  assert.equal(p010LessonCanvasResourceForRequest(extraQuery,env),null);
  for(const [header,value] of [['range','bytes=0-1'],['host','localhost:3331'],
    ['origin','http://localhost:3331'],['sec-fetch-site','cross-site'],
    ['sec-fetch-dest','empty'],['sec-fetch-mode','navigate']] as const){
    const r=request(id);r.headers.set(header,value);
    assert.equal(p010LessonCanvasResourceForRequest(r,env),null,header);
  }
  const cors=request(id);cors.headers.set('sec-fetch-mode','cors');
  assert.equal(p010LessonCanvasResourceForRequest(cors,env),null);
  cors.headers.set('origin',origin);
  assert.equal(p010LessonCanvasResourceForRequest(cors,env),id);
  const head=request(id);head.method='HEAD';
  assert.equal(p010LessonCanvasResourceForRequest(head,env),null);
  const wrongPort=request(id);wrongPort.url.port='3332';
  assert.equal(p010LessonCanvasResourceForRequest(wrongPort,env),null);
});

test('production request module exposes no pins and denies every Canvas request',()=>{
  assert.deepEqual(Object.keys(production.P010_LESSON_CANVAS_RESOURCES),[]);
  assert.deepEqual(production.P010_LESSON_CANVAS_ORIGINAL_PATHS,[]);
  for(const id of ids){
    assert.equal(production.p010LessonCanvasResourceForRequest(request(id),env),null);
    assert.equal(production.isP010LessonCanvasOriginalRequest(request(id),env),false);
  }
});
