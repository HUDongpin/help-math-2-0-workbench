#!/usr/bin/env node
// Maintained, source-locked successor of existing G3 L4 bindings. No factory replay.
import assert from 'node:assert/strict';
import {readFile, mkdir, lstat, writeFile, rename, unlink} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {brotliDecompressSync} from 'node:zlib';
import {digest, generateIn023EndStage, IN023_BASE_SHA256, IN023_BASE_BYTES, IN023_EFFECTIVE_SHA256, IN023_EFFECTIVE_BYTES, IN023_ASSET_PATH} from './lib/in023-sprite220-end-stage-v1.mjs';
import {loadIn023Overlay, TRANSFORM_ROOT, MANIFEST_PATH, CANDIDATE_PATH, PUBLIC_PATH, ACCEPTANCE_KEYS} from './lib/in023-materialization-overlay-v1.mjs';

export const WRITER_PATH = 'scripts/build-g3-l4-in023-end-stage-bindings-v1.mjs';
export const BINDING_PLAN_PATH = TRANSFORM_ROOT + '/binding-plan.json';
export const PREDECESSOR_FREEZE = 'catalog/product-bridge-calibrations/g3-l4-page-only-current-js-67-v1.json';
export const SUCCESSOR_FREEZE = 'catalog/product-bridge-calibrations/g3-l4-page-only-current-js-67-in023-end-stage-v1.json';
const ID = 'course-g03-l04-in-023';
const CALIBRATION = 'g3-l4-page-only-current-js-67-v1';
export const BINDINGS = Object.freeze({
  profile: 'apps/web/config/current-js-candidate-assets.v1.json',
  timeline: 'packages/demos/src/timelines/course-g03-l04-in-023.ts',
  generated: 'apps/web/lib/g3-l4-page-only-current-js.generated.ts',
  registry: 'packages/demos/private-current-js-registry.json',
  freeze: PREDECESSOR_FREEZE,
});
const OLD_HASHES = Object.freeze({
  profile: '22cde14476889c886d584e94e18a97926092477c6ccec716a25bd6e6bba18f83',
  timeline: '18c81ce49fdf122a4aa575c5fd77d7f2855e7909c8c2df2ae74384b971d63a81',
  generated: '89752fac8d2c1bde30d6c58464add41fb162a1e84485b8eb6e6f7ce8b4e21294',
  registry: '7e243500765a0fc53aa65954853919918450b204024f396099a889cf0463e223',
  freeze: '2080c6a329f906065b488ba14aa3f232d1873c281d67a829371e16cefcdae44d',
});
const OLD_SIZES = Object.freeze({profile:472049, timeline:2677, generated:100003, registry:308472, freeze:111152});
const json = (value) => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const ref = (relative, bytes) => ({path:relative, bytes:bytes.length, sha256:digest(bytes)});
const keys = (value, expected) => assert.deepEqual(Object.keys(value).sort(), [...expected].sort());
const same = (left, right) => assert.deepEqual(left, right);
const copy = (value) => structuredClone(value);
function one(rows, matches, count) {
  assert.equal(rows.length, count);
  const found = rows.filter(matches); assert.equal(found.length, 1); return found[0];
}
function noAcceptance(value) {
  keys(value, ACCEPTANCE_KEYS); assert(Object.values(value).every((v) => v === false));
}
function generatedDocument(bytes) {
  const text = bytes.toString('utf8');
  const marker = 'export const G3_L4_PAGE_ONLY_CURRENT_JS = Object.freeze(';
  const start = text.indexOf(marker); assert(start > 0);
  assert(text.endsWith(' as const);\n'));
  const header = text.slice(0, start);
  const data = JSON.parse(text.slice(start + marker.length, -' as const);\n'.length));
  assert.equal(header + marker + JSON.stringify(data, null, 2) + ' as const);\n', text);
  return {data, marker};
}
async function readMaybe(file) {
  try { return await readFile(file); } catch(error) { if(error.code === 'ENOENT') return null; throw error; }
}
// Reject a symlink at any output ancestor, including the root. Inputs remain read-only.
async function safeTarget(root, relative) {
  assert(!path.isAbsolute(relative) && relative.split('/').every((p) => /^[A-Za-z0-9._-]+$/.test(p) && p !== '.' && p !== '..'));
  const target = path.join(root, relative);
  const all = path.resolve(target).split(path.sep).filter(Boolean);
  let current = path.parse(target).root;
  for (const part of all) {
    current = path.join(current, part);
    try { assert(!(await lstat(current)).isSymbolicLink(), 'Output symlink rejected: ' + current); }
    catch(error) { if(error.code !== 'ENOENT') throw error; }
  }
  return target;
}
export async function createBindingOutputs(root) {
  const overlay = await loadIn023Overlay(root);
  const planBytes = await readFile(path.join(root, BINDING_PLAN_PATH));
  const plan = JSON.parse(planBytes);
  keys(plan, ['schemaVersion','transformId','predecessors']);
  assert.equal(plan.schemaVersion,1); assert.equal(plan.transformId,'in023-sprite220-split-v1');
  keys(plan.predecessors, Object.keys(BINDINGS));
  const originals = {};
  for(const [name, relative] of Object.entries(BINDINGS)) {
    const record = plan.predecessors[name];
    same(record, {path:relative, retainedPath:TRANSFORM_ROOT+'/predecessors/'+name, bytes:OLD_SIZES[name], sha256:OLD_HASHES[name]});
    const bytes = await readFile(path.join(root, record.retainedPath));
    assert.equal(bytes.length,record.bytes); assert.equal(digest(bytes),record.sha256);
    originals[name] = bytes;
  }
  const preservedFreeze = await readFile(path.join(root, PREDECESSOR_FREEZE));
  assert(preservedFreeze.equals(originals.freeze), 'Historical freeze changed');
  const manifestBytes = await readFile(path.join(root, MANIFEST_PATH));
  const transformation = ref(MANIFEST_PATH, manifestBytes);
  const writerBytes = await readFile(path.join(root, WRITER_PATH));
  const base = brotliDecompressSync(overlay.retainedBase);
  assert.equal(base.length,IN023_BASE_BYTES); assert.equal(digest(base),IN023_BASE_SHA256);
  const runtimeBytes = generateIn023EndStage(base, overlay.ir);

  const profile = JSON.parse(originals.profile);
  const row = one(profile.entries, (r) => r.assetPath === IN023_ASSET_PATH, 1331);
  same(row, {assetPath:IN023_ASSET_PATH, relativePath:ID+'/canvas-renderer.js', storageRoot:'candidate', releaseId:'lesson-g03-l04-division-page-only', bytes:IN023_BASE_BYTES, sha256:IN023_BASE_SHA256});
  row.bytes = IN023_EFFECTIVE_BYTES; row.sha256 = IN023_EFFECTIVE_SHA256;
  const profileInverse = copy(profile); Object.assign(profileInverse.entries.find((r) => r.assetPath === IN023_ASSET_PATH), {bytes:IN023_BASE_BYTES,sha256:IN023_BASE_SHA256});
  assert(json(profileInverse).equals(originals.profile), 'Non-target profile changed');

  const freeze = JSON.parse(originals.freeze);
  assert.equal(freeze.schemaVersion,1); assert.equal(freeze.calibrationId,CALIBRATION);
  noAcceptance(freeze.acceptanceEffects);
  const frozenPage = one(freeze.selectedPages,(p) => p.animationId === ID,67);
  assert.equal(frozenPage.globalPageOrdinal,39); assert.equal(frozenPage.sectionPageOrdinal,22);
  assert.equal(frozenPage.runtime.asset.runtimeSha256,IN023_BASE_SHA256); assert.equal(frozenPage.runtime.asset.runtimeBytes,IN023_BASE_BYTES);
  frozenPage.runtime.asset.runtimeSha256=IN023_EFFECTIVE_SHA256; frozenPage.runtime.asset.runtimeBytes=IN023_EFFECTIVE_BYTES;
  frozenPage.runtime.asset.endStageTransformation=transformation;
  freeze.runtimeTransformation={
    kind:'source-locked-single-runtime-successor',
    predecessor:ref(PREDECESSOR_FREEZE,originals.freeze),
    manifest:transformation,
    bindingWriter:ref(WRITER_PATH,writerBytes),
    bindingPlan:ref(BINDING_PLAN_PATH,planBytes),
    inheritedInputStatus:'The inputs object and pre-existing manifest/adapter references are preserved historical declarations. Their factory closure is not re-executed or newly verified by this successor.',
    outputScope:'Only course-g03-l04-in-023 effective runtime; all 67 placements and independent acceptance fields are preserved.',
  };
  const inverseFreeze=copy(freeze); delete inverseFreeze.runtimeTransformation;
  const inverseAsset=inverseFreeze.selectedPages.find((p)=>p.animationId===ID).runtime.asset;
  delete inverseAsset.endStageTransformation; inverseAsset.runtimeSha256=IN023_BASE_SHA256; inverseAsset.runtimeBytes=IN023_BASE_BYTES;
  assert(json(inverseFreeze).equals(originals.freeze), 'Non-target freeze changed');
  const freezeBytes=json(freeze);

  const {data,marker}=generatedDocument(originals.generated);
  assert.equal(data.calibrationId,CALIBRATION); noAcceptance(data.acceptanceEffects);
  same(data.freeze,{path:PREDECESSOR_FREEZE,sha256:OLD_HASHES.freeze});
  const generatedPage=one(data.pages,(p)=>p.animationId===ID,67);
  assert.equal(generatedPage.ordinal,39); assert.equal(generatedPage.runtime.runtimeSha256,IN023_BASE_SHA256);
  generatedPage.runtime.runtimeBytes=IN023_EFFECTIVE_BYTES; generatedPage.runtime.runtimeSha256=IN023_EFFECTIVE_SHA256;
  generatedPage.runtime.endStageTransformation=transformation;
  data.freeze={path:SUCCESSOR_FREEZE,sha256:digest(freezeBytes)};
  const generatedInverse=copy(data);
  generatedInverse.freeze={path:PREDECESSOR_FREEZE,sha256:OLD_HASHES.freeze};
  const oldRuntime=generatedInverse.pages.find((p)=>p.animationId===ID).runtime;
  oldRuntime.runtimeBytes=IN023_BASE_BYTES; oldRuntime.runtimeSha256=IN023_BASE_SHA256; delete oldRuntime.endStageTransformation;
  same(generatedInverse,generatedDocument(originals.generated).data);
  const generatedBytes=Buffer.from('/* Generated by '+WRITER_PATH+' from a retained predecessor. Do not edit. */\n'+marker+JSON.stringify(data,null,2)+' as const);\n');

  const timeline=originals.timeline.toString('utf8');
  const from='"assetSha256": "'+IN023_BASE_SHA256+'"';
  assert.equal(timeline.split(from).length,2);
  const timelineBytes=Buffer.from(timeline.replace(from,'"assetSha256": "'+IN023_EFFECTIVE_SHA256+'"'));
  const registry=JSON.parse(originals.registry);
  const calibration=one(registry.calibrations,(c)=>c.calibrationId===CALIBRATION,registry.calibrations.length);
  assert.equal(calibration.entries.length,67); assert.equal(calibration.freezeManifest,PREDECESSOR_FREEZE);
  calibration.freezeManifest=SUCCESSOR_FREEZE;
  const inverseRegistry=copy(registry); inverseRegistry.calibrations.find((c)=>c.calibrationId===CALIBRATION).freezeManifest=PREDECESSOR_FREEZE;
  assert(json(inverseRegistry).equals(originals.registry), 'Registry membership changed');

  const outputs=[
    {path:PUBLIC_PATH,bytes:runtimeBytes,priorHash:IN023_BASE_SHA256,allowAbsent:true},
    {path:CANDIDATE_PATH,bytes:runtimeBytes,priorHash:IN023_BASE_SHA256,allowAbsent:true},
    {path:BINDINGS.profile,bytes:json(profile),priorHash:OLD_HASHES.profile},
    {path:BINDINGS.timeline,bytes:timelineBytes,priorHash:OLD_HASHES.timeline},
    {path:SUCCESSOR_FREEZE,bytes:freezeBytes,allowAbsent:true},
    {path:BINDINGS.generated,bytes:generatedBytes,priorHash:OLD_HASHES.generated},
    {path:BINDINGS.registry,bytes:json(registry),priorHash:OLD_HASHES.registry},
  ];
  assert.equal(new Set(outputs.map((v)=>v.path)).size,7);
  return outputs;
}
export async function verifyActiveBindingMetadata(root) {
  const outputs=await createBindingOutputs(root);
  for(const output of outputs.filter((o)=>o.path!==PUBLIC_PATH && o.path!==CANDIDATE_PATH)) {
    const target=await safeTarget(root,output.path);
    assert((await readFile(target)).equals(output.bytes),'Active metadata missing/stale: '+output.path);
  }
}
export async function processBindings(root, action) {
  assert(['--write','--check','--plan'].includes(action));
  const outputs=await createBindingOutputs(root);
  // Complete every input/output guard before the first write; never overwrite a third state.
  for(const output of outputs) {
    output.target=await safeTarget(root,output.path);
    const existing=await readMaybe(output.target); output.existing=existing;
    if(action==='--check') assert(existing?.equals(output.bytes),'Effective binding missing/stale: '+output.path);
    else if(existing) assert(existing.equals(output.bytes)||digest(existing)===output.priorHash,'Unreviewed current output: '+output.path);
    else assert(output.allowAbsent,'Missing predecessor output: '+output.path);
  }
  if(action==='--write') for(const output of outputs) {
    if(output.existing?.equals(output.bytes)) continue;
    await mkdir(path.dirname(output.target),{recursive:true});
    const temporary=output.target+'.in023-'+process.pid;
    try { await writeFile(temporary,output.bytes,{flag:'wx'}); await rename(temporary,output.target); }
    finally { await unlink(temporary).catch((e)=>{if(e.code!=='ENOENT')throw e;}); }
  }
  return {state:action==='--check'?'verified-effective-bindings':action==='--write'?'materialized-effective-bindings':'prepared-not-written', outputs:outputs.map((o)=>ref(o.path,o.bytes)), unchangedOtherCandidateEntries:1330, preservedLessonPlacements:67, unchangedOtherLessonPages:66, registrationCountDelta:0, acceptanceCountDelta:0};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  assert.equal(process.argv.length,3,'Use --plan, --check or --write');
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  process.stdout.write(JSON.stringify(await processBindings(root,process.argv[2]),null,2)+'\n');
}
