import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync, realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateRuntime, replaceOnce} from './build-g678-alg-l12-p006-candidate.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = 'migrations/shared-alg001-l12-p006';
const V1 = '95e0f487767fce6364c7e120b75caa81d541cfd96a0f09294be82a488bfc5df6';
const XML_SHA = '60c835b77135803e0699aa6580650413ec9591d14f17dbe70d01365cea28a77a';
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/RW/L12RW06.swf';
const SOURCE_SHA = '933f1f6db59435e882c1bf6e9392259fc1d28c0974a0a4c6cebc9bcc7a5d46b6';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function maskBody(runtime, name) {
  const start = runtime.indexOf(`function ${name}(`);
  assert(start >= 0 && runtime.indexOf(`function ${name}(`, start + 1) < 0);
  const end = runtime.indexOf('\n}', start) + 2;
  assert(end > start);
  return {start, end, text: runtime.slice(start, end)};
}

export function correctP006Masks(runtime) {
  for (const [name, fill] of [
    ['shape1', 'ctx.fillStyle=tocolor(ctrans.apply([66,60,196,0.3529412]));'],
    ['shape52', 'ctx.fillStyle=tocolor(ctrans.apply([0,0,204,0.2]));'],
    ['morphshape43', 'ctx.fillStyle=tocolor(ctrans.apply([Math.round(0+ratio*(0)/65535),Math.round(0+ratio*(0)/65535),Math.round(204+ratio*(1)/65535),((Math.round(51+ratio*(0)/65535))/255)]));'],
  ]) {
    const body = maskBody(runtime, name);
    assert.equal((body.text.match(/ctx.fill\("evenodd"\)/g) || []).length, 1);
    let corrected = replaceOnce(body.text, fill, 'ctx.fillStyle="rgba(255,255,255,1)";');
    if (name === 'morphshape43') {
      // The source mask's zero-width transparent stroke is not mask geometry.
      const fillEnd = corrected.indexOf('ctx.fill("evenodd");') + 'ctx.fill("evenodd");'.length;
      const stroke = corrected.slice(fillEnd);
      assert(stroke.includes('drawMorphPath(ctx,pathData,ratio,true,scaleMode);'));
      assert(stroke.includes('ctx.lineWidth=0.0+ratio*(0)/65535;'));
      corrected = corrected.slice(0, fillEnd) + '\n}';
    } else assert(!corrected.includes('stroke'));
    runtime = runtime.slice(0, body.start) + corrected + runtime.slice(body.end);
  }
  return runtime;
}

export function auditP006Masks(xmlPath) {
  const probe = spawnSync('python3', ['-', xmlPath], {encoding: 'utf8', maxBuffer: 1024 * 1024, input: `
import json,sys,xml.etree.ElementTree as E
r=E.parse(sys.argv[1]).getroot();ids={'1','43','52'};uses=[];definitions=[]
for e in r.iter('item'):
 if e.get('characterId') in ids and e.get('type')!='DefineMorphShapeTag':
  assert e.get('type')=='PlaceObject2Tag'
  assert e.get('placeFlagHasClipDepth')=='true' and e.get('placeFlagHasColorTransform')=='false'
  uses.append({k:e.get(k) for k in ('characterId','depth','clipDepth')})
 if e.get('shapeId') in ('1','52'):
  fills=e.findall('./shapes/fillStyles/fillStyles/item');lines=e.findall('./shapes/lineStyles/lineStyles/item')
  assert len(fills)==1 and fills[0].get('fillStyleType')=='0' and not lines
  definitions.append({'id':e.get('shapeId'),'alpha':fills[0].find('color').get('alpha')})
 if e.get('type')=='DefineMorphShapeTag' and e.get('characterId')=='43':
  fills=e.findall('./morphFillStyles/fillStyles/item');lines=e.findall('./morphLineStyles/lineStyles/item')
  assert len(fills)==len(lines)==1 and fills[0].get('fillStyleType')=='0'
  assert [fills[0].find(k).get('alpha') for k in ('startColor','endColor')]==['51','51']
  assert [lines[0].get(k) for k in ('startWidth','endWidth')]==['0','0']
  assert [lines[0].find(k).get('alpha') for k in ('startColor','endColor')]==['0','0']
  definitions.append({'id':'43','alpha':'51','stroke':'zero-width-zero-alpha'})
for container in [r.find('tags')]+list(r.iter('subTags')):
 active={}
 for e in container:
  kind=e.get('type');d=e.get('depth')
  if kind=='PlaceObject2Tag':
   if active.get(d) in ids:
    assert e.get('placeFlagHasColorTransform')=='false' and e.get('placeFlagHasClipActions')=='false'
   if e.get('placeFlagHasCharacter')=='true':active[d]=e.get('characterId')
  elif kind=='RemoveObject2Tag':active.pop(d,None)
print(json.dumps({'uses':uses,'definitions':definitions}))
`});
  assert.equal(probe.status, 0, probe.stderr);
  const audit = JSON.parse(probe.stdout);
  assert.deepEqual(audit.uses, [{characterId: '1', depth: '1', clipDepth: '62'},
    {characterId: '43', depth: '18', clipDepth: '29'}, {characterId: '52', depth: '18', clipDepth: '29'}]);
  assert.deepEqual(audit.definitions, [{id: '1', alpha: '90'}, {id: '43', alpha: '51', stroke: 'zero-width-zero-alpha'}, {id: '52', alpha: '51'}]);
  return audit;
}

function main() {
  const check = process.argv[2] === '--check';
  assert(process.argv.length === 2 || (check && process.argv.length === 3));
  assert.equal(realpathSync(SOURCE), SOURCE);
  assert.equal(hash(readFileSync(SOURCE)), SOURCE_SHA);
  const xml = resolve(ROOT, WORK, 'audit/ffdec-26.2.1/movie.xml');
  assert.equal(hash(readFileSync(xml)), XML_SHA);
  const audit = auditP006Masks(xml);
  const old = readFileSync(resolve(ROOT, WORK, 'candidate-v1/canvas-renderer.js'), 'utf8');
  assert.equal(hash(old), V1);
  const runtime = correctP006Masks(old);
  validateRuntime(runtime);
  const manifest = {schemaVersion: 1, animationId: 'shared-alg001-l12-p006',
    status: 'unregistered-mask-corrected-drawing-candidate', predecessorRuntimeSha256: V1,
    sourceSha256: SOURCE_SHA, xmlSha256: XML_SHA, runtimeSha256: hash(runtime), runtimeBytes: Buffer.byteLength(runtime),
    maskAudit: audit, rule: 'Fill geometry only for exclusively used clipDepth shapes; preserve all other source paths, colors and placement.',
    reference: 'https://helpx.adobe.com/uk/animate/desktop/animation/using-mask-layers.html',
    browserValidated: false, registered: false, originalRuntimeVerified: false, audioAccepted: false, strictComplete: false};
  const out = resolve(ROOT, WORK, 'candidate-v2');
  if (!check) mkdirSync(out);
  for (const [name, contents] of [['canvas-renderer.js', runtime], ['mask-manifest.json', JSON.stringify(manifest, null, 2) + '\n']]) {
    const file = resolve(out, name);
    if (check) assert.equal(readFileSync(file, 'utf8'), contents);
    else writeFileSync(file, contents, {flag: 'wx'});
  }
  console.log(JSON.stringify(manifest, null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
