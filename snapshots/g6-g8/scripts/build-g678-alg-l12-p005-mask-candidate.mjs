import assert from 'node:assert/strict';
import {readFileSync, realpathSync, mkdirSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';
import {validateP005Runtime} from './validate-g678-alg-l12-p005-runtime.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const WORK='migrations/shared-alg001-l12-p005';
const sha=b=>createHash('sha256').update(b).digest('hex');
const V1='3dbbe2b2448530f9c531b3de9609e6f3167e0803a7c1e7d38899fd422d51713c';
const SOURCE='/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW05.swf';
const SOURCE_SHA='b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const XML_SHA='944585dd7b3b53e2d65dc268fffcb1f5c81bde71de5f79c5d2c9c158a142f128';

export function correctP005Masks(runtime) {
  // These characters are exclusively simple clipping geometry, never visible art.
  // Adobe: https://helpx.adobe.com/uk/animate/desktop/animation/using-mask-layers.html
  for(const [id,rgba] of [[1,'66,60,196,0.3529412'],[203,'54,107,231,0.4627451']]) {
    const start=runtime.indexOf(`function shape${id}(`);
    assert(start>=0 && runtime.indexOf(`function shape${id}(`,start+1)<0,'unique mask function');
    const end=runtime.indexOf('\n}',start)+2;
    const body=runtime.slice(start,end);
    const marker=`ctx.fillStyle=tocolor(ctrans.apply([${rgba}]));`;
    assert.equal(body.split(marker).length,2,'exact source mask alpha');
    assert.equal((body.match(/ctx.fill\("evenodd"\)/g)||[]).length,1);
    runtime=runtime.slice(0,start)+body.replace(marker,'ctx.fillStyle="rgba(255,255,255,1)";')+runtime.slice(end);
  }
  return runtime;
}

export function auditP005Masks(xml) {
  const result=spawnSync('python3',['-',xml],{encoding:'utf8',maxBuffer:1024*1024,input:`import json,sys,xml.etree.ElementTree as E
r=E.parse(sys.argv[1]).getroot()
uses=[]
defs=[]
for container in [r.find('tags')]+list(r.iter('subTags')):
 active={}
 for e in container:
  kind=e.get('type','')
  assert kind!='PlaceObject3Tag', 'unexpected advanced placement'
  if kind=='PlaceObject2Tag':
   depth=e.get('depth')
   assert active.get(depth) not in ('1','203'), 'mask depth updated while active'
   if e.get('placeFlagHasCharacter')=='true': active[depth]=e.get('characterId')
  elif kind=='RemoveObject2Tag': active.pop(e.get('depth'),None)
for e in r.iter('item'):
 if e.get('characterId') in ('1','203'):
  assert e.get('type')=='PlaceObject2Tag' and e.get('placeFlagHasClipDepth')=='true'
  assert e.get('placeFlagHasColorTransform')=='false'
  uses.append({k:e.get(k) for k in ('characterId','depth','clipDepth')})
 if e.get('shapeId') in ('1','203'):
  assert e.get('type')=='DefineShape3Tag'
  fills=e.findall('./shapes/fillStyles/fillStyles/item')
  assert len(fills)==1 and fills[0].get('fillStyleType')=='0'
  assert len(e.findall('./shapes/lineStyles/lineStyles/item'))==0
  defs.append({'id':e.get('shapeId'),'alpha':fills[0].find('color').get('alpha')})
print(json.dumps({'uses':uses,'definitions':defs}))
`});
  assert.equal(result.status,0,result.stderr);
  const audit=JSON.parse(result.stdout);
  assert.deepEqual(audit,{uses:[{characterId:'1',depth:'1',clipDepth:'132'},{characterId:'203',depth:'2',clipDepth:'56'}],definitions:[{id:'1',alpha:'90'},{id:'203',alpha:'118'}]});
  return audit;
}

function main() {
  const args=process.argv.slice(2); const check=args.length===1&&args[0]==='--check';
  assert(args.length===0||check,'only --check supported');
  assert.equal(realpathSync(SOURCE),SOURCE,'physical source required');
  assert.equal(sha(readFileSync(SOURCE)),SOURCE_SHA);
  const xml=resolve(ROOT,WORK,'audit/movie.xml');
  assert.equal(sha(readFileSync(xml)),XML_SHA);
  const maskAudit=auditP005Masks(xml);
  const old=readFileSync(resolve(ROOT,WORK,'candidate-v1/canvas-renderer.js'),'utf8');
  assert.equal(sha(old),V1);
  const runtime=correctP005Masks(old);
  validateP005Runtime(runtime);
  const manifest={schemaVersion:1,animationId:'shared-alg001-l12-p005',status:'unregistered-mask-corrected-drawing-candidate',sourceSha256:SOURCE_SHA,xmlSha256:XML_SHA,predecessorRuntimeSha256:V1,runtimeSha256:sha(runtime),runtimeBytes:Buffer.byteLength(runtime),maskAudit,rule:'Opaque geometry coverage for the two exclusive clipDepth shapes; preserve paths, placement and all non-mask alpha.',reference:'https://helpx.adobe.com/uk/animate/desktop/animation/using-mask-layers.html',acceptanceEffects:{currentJavaScriptRegistered:false,originalRuntimeVerified:false,fidelityAccepted:false,audioAccepted:false,strictComplete:false}};
  const out=resolve(ROOT,WORK,'candidate-v2');
  if(!check)mkdirSync(out);
  for(const [name,contents] of [['canvas-renderer.js',runtime],['mask-manifest.json',JSON.stringify(manifest,null,2)+'\n']]) {
    const file=resolve(out,name);
    if(check)assert.equal(readFileSync(file,'utf8'),contents,'candidate drift');
    else writeFileSync(file,contents,{flag:'wx'});
  }
  console.log(JSON.stringify(manifest,null,2));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
