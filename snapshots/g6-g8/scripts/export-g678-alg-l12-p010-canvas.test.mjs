import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {inspectP010Xml,inspectP010Canvas,P010_SOURCE_ROOT} from './export-g678-alg-l12-p010-canvas.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASE='migrations/shared-alg001-l12-p010/audit/ffdec-26.2.1-canvas-v1';
const read=p=>readFileSync(new URL('../'+p,import.meta.url));
const xml=read('migrations/shared-alg001-l12-p010/audit/movie.xml'),projection=inspectP010Xml(xml);
const html=read(BASE+'/frames/frames.html').toString().replace(/\r\n?/g,'\n');
function run(mode,source=P010_SOURCE_ROOT){return spawnSync(process.execPath,['scripts/export-g678-alg-l12-p010-canvas.mjs',mode],{cwd:ROOT,env:{...process.env,HELP_MATH_G678_SOURCE_ROOT:source},encoding:'utf8',timeout:30000,maxBuffer:1024*1024});}

test('P010 exact XML closure contains root96/97, all97 definitions and four465-frame masks',()=>{
  assert.deepEqual(projection.timelines.root.references,[96,97]);
  assert.equal(projection.reachableDefinitions.length,97);assert.deepEqual(projection.unreachableCharacterIds,[]);
  assert.equal(projection.buttonStates.length,9);assert(projection.buttonStates.every(b=>b.hitOnly&&b.references.join(',')==='21'));
  const closure=inspectP010Canvas(html,projection);assert.equal(closure.maskFramesChecked,465);assert.equal(closure.generatedMaskBlockCount,1499);
  assert.equal(closure.sourceTextFunctionCount,28);assert.equal(closure.sourceShapeFunctionCount,58);assert.equal(closure.declaredSourceCharacterFunctions,97);
  assert.deepEqual(closure.maskFrameCounts.slice(7,11),[0,0,1,1]);assert.equal(closure.maskFrameCounts[464],4);
});
test('source frame/mask/reference corruption fails closed before Canvas acceptance',()=>{
  assert.throws(()=>inspectP010Xml(Buffer.from(xml.toString().replace('frameCount="465"','frameCount="464"'))),/ShowFrame count/);
  assert.throws(()=>inspectP010Xml(Buffer.from(xml.toString().replace('clipDepth="10"','clipDepth="9"'))));
  assert.throws(()=>inspectP010Xml(Buffer.from(xml.toString().replace('characterId="96" depth="1"','characterId="999" depth="1"'))),/missing referenced character/);
  assert.throws(()=>inspectP010Canvas(html.replace('ctx.drawImage(o.clipCanvas,0,0);','/* removed mask */'),projection),/incomplete mask block at frame 10/);
  assert.throws(()=>inspectP010Canvas(html.replace('place("text4"','place("text999"'),projection),/missing nested dependency/);
  assert.throws(()=>inspectP010Canvas(html.replace('function font3(','function font999('),projection),/source dependency missing: font3/);
  assert.throws(()=>inspectP010Canvas(html.replace('\t\tcase 464:','\t\tcase 463:'),projection),/source frame case order changed/);
});
test('actual export check rehashes raw source/tool files and refuses overwrite or source alias',()=>{
  const before=read(BASE+'/extraction-receipt.json'),raw=read(BASE+'/frames/frames.html'),checked=run('--check');assert.equal(checked.status,0,checked.stderr);
  const status=JSON.parse(checked.stdout);assert.equal(status.files,6);assert.equal(status.closure.generatedMaskBlockCount,1499);
  const receipt=JSON.parse(before);assert.equal(receipt.retainedFailurePinsCopied,false);assert.equal(receipt.rawOutputsUnchanged,true);assert(Object.values(receipt.acceptanceEffects).every(v=>v===false));
  assert(receipt.command.includes('96'));assert.equal(receipt.selectedDomains['sprite-96'],465);
  assert.notEqual(run('--check','/not-the-real-source-root').status,0);
  const duplicate=run('--export');assert.notEqual(duplicate.status,0);assert.match(duplicate.stderr,/EEXIST/);
  assert(read(BASE+'/extraction-receipt.json').equals(before));assert(read(BASE+'/frames/frames.html').equals(raw));
});
