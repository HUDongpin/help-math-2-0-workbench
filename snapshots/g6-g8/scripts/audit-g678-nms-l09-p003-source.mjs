#!/usr/bin/env node
// Narrow, read-only source gate for the P003 clock candidate. It does not
// authorize canvas generation, Current-JS registration, or audio acceptance.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {parseSwfSourceFacts} from './build-g4-l3-machine-source-audits.mjs';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

export const SOURCE = Object.freeze({
  path: 'G6-G8-shared/NMS002/L9/RW/L9RW03.swf',
  bytes: 473410,
  sha256: 'd6841b40ee8da4857ba9075944c2393ee214e056373fe10abd2f0c2b2a375ebd',
});
export const MAIN = Object.freeze({id: 246, frames: 635,
  nested: Object.freeze([10, 23, 28, 55, 74, 88, 101, 241]),
  sibling: 249});
const NESTED_FRAMES = Object.freeze([607, 442, 610, 200, 520, 23, 22, 19]);
const STRUCTURE_SHA256 =
  'd342ae6aed23631a8e0ee0c2a2506d32dd9552570063d11d4e2f93ffcf0b0562';
const STOP = 'stop();\r\n';
const PRELOADER = '_level0.InternalPreloader.gotoAndPlay("jump_check");\r\nstop();\r\n';
const SCRIPT_FILES = Object.freeze([
  'frame_1/DoAction.as',
  'frame_6/DoAction.as',
  'DefineSprite_246/frame_635/DoAction.as',
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function validateP003SourceStructure(bytes, facts) {
  assert.equal(bytes.length, SOURCE.bytes, 'P003 SWF size drift');
  assert.equal(sha256(bytes), SOURCE.sha256, 'P003 SWF hash drift');
  assert.equal(facts.structureFingerprintSha256, STRUCTURE_SHA256,
    'P003 parser structure fingerprint drift');
  assert.equal(facts.header.rootFrameCount, 10);
  assert.deepEqual({width: facts.header.stage.width,
    height: facts.header.stage.height, fps: facts.header.fps},
  {width: 800, height: 600, fps: 12});
  assert.equal(facts.actionScript.version, 'AS1/2');
  assert.equal(facts.actionScript.tagCounts.DoAction, 3);
  assert.equal(facts.actionScript.tagCounts.DoInitAction, 0);
  assert.equal(facts.actionScript.tagCounts.DoABC, 0);
  assert.equal(facts.actionScript.tagCounts.DoABCDefine, 0);
  assert.equal(facts.tagCounts.DefineButton ?? 0, 0);
  assert.equal(facts.tagCounts.DefineButton2 ?? 0, 0);
  assert.equal(facts.audio.tagCounts.SoundStreamHead, 1);
  assert.equal(facts.audio.tagCounts.SoundStreamBlock, MAIN.frames);
  assert.equal(facts.audio.tagCounts.DefineSound, 0);
  assert.equal(facts.audio.tagCounts.StartSound, 0);
  assert.deepEqual(facts.linkageAndImports.importedAssets, []);
  assert.deepEqual(facts.linkageAndImports.exportedAssets, []);
  const domains = facts.frameDomains.domains;
  const root = domains.find(item => item.domainId === 'root');
  const main = domains.find(item => item.domainId === `sprite-${MAIN.id}`);
  assert(root && main, 'P003 direct root/main domains required');
  assert.equal(root.scriptTagCount, 2);
  assert.equal(main.scriptTagCount, 1);
  assert.equal(main.declaredFrameCount, MAIN.frames);
  assert.deepEqual(root.placedSpriteIds, [MAIN.id, MAIN.sibling]);
  assert.deepEqual(root.placementEdges.map(edge => edge.characterId),
    [246, 247, 249, 250]);
  assert.deepEqual(main.placedSpriteIds, MAIN.nested);
  assert.deepEqual(main.parentDomainIds, ['root']);
  assert.equal(root.placementEdges.find(edge =>
    edge.childSpriteId === MAIN.id)?.firstFrame, 6);
  assert.equal(root.placementEdges.find(edge =>
    edge.childSpriteId === MAIN.sibling)?.firstFrame, 6);
  for (const [index, id] of MAIN.nested.entries()) {
    const child = domains.find(item => item.domainId === `sprite-${id}`);
    assert(child && child.scriptTagCount === 0,
      `P003 nested/sibling sprite-${id} script drift`);
    assert.equal(child.declaredFrameCount, NESTED_FRAMES[index],
      `P003 nested sprite-${id} frame drift`);
  }
  const sibling = domains.find(item =>
    item.domainId === `sprite-${MAIN.sibling}`);
  assert(sibling && sibling.scriptTagCount === 0 &&
    sibling.declaredFrameCount === 1,
  'P003 root sibling sprite drift');
  assert.deepEqual(domains.filter(item => item.staticallyRootReachable &&
    item.kind === 'sprite').map(item => item.spriteId).sort((a, b) => a - b),
  [...MAIN.nested, MAIN.id, MAIN.sibling].sort((a, b) => a - b));
  return Object.freeze({sourceSha256: SOURCE.sha256,
    sourceStructureFingerprintSha256: facts.structureFingerprintSha256,
    rootBeginFrame: 6, mainFrameDomain: `sprite-${MAIN.id}`,
    mainFrameCount: MAIN.frames, nestedSpriteIds: MAIN.nested,
    rootSiblingSpriteId: MAIN.sibling,
    soundStreamBlockCount: facts.audio.tagCounts.SoundStreamBlock,
    claimBoundary: 'structural-and-script-only; no runtime, audio, or fidelity acceptance'});
}

/** Source-bound text identities and the mask's five readable reveal beats.
 * Static placement does not itself prove original-runtime visibility. */
export function validateP003TextSource(bytes) {
  assert.equal(sha256(bytes), SOURCE.sha256, 'P003 text source hash drift');
  const catalog = collectSwfTextSourceCatalog(bytes);
  assert.equal(catalog.summary.textDefinitions, 10);
  assert.equal(catalog.summary.unresolvedRuns, 0);
  assert.deepEqual(catalog.unparsedTags, []);
  const text = new Map(catalog.textDefinitions.map(definition =>
    [definition.characterId, definition.runs.map(run => run.text).join('')]));
  assert.deepEqual([...text.entries()], [
    [105, 'Tank 1 = 5 bags of food'],
    [106, '+ 2 bags of food'],
    [107, 'Total:     11 bags of food'],
    [110, 'Daily Fish Feeding Schedule'],
    [111, 'Daily Fish Feeding Schedule'],
    [155, ' FISH FOOD'],
    [228, 'Tank 1 = 5 bags of food'],
    [232, '5 + 3 x 2'],
    [239, '+ 2 bags of food'],
    [247, 'Properties of Operations: Real World Activity'],
  ]);
  const formula = catalog.textDefinitions.find(item => item.characterId === 232);
  assert.deepEqual(formula.runs.map(run => [run.sourceTextId, run.text]), [
    ['character-232/run-0', '5 '],
    ['character-232/run-1', '+'],
    ['character-232/run-2', ' 3 '],
    ['character-232/run-3', 'x'],
    ['character-232/run-4', ' 2'],
  ]);
  const root = catalog.timelines.find(item => item.timelineId === 'root');
  const main = catalog.timelines.find(item => item.timelineId === 'sprite-246');
  assert(root && main);
  assert.deepEqual(root.instances.filter(item => item.characterId === 247)
    .map(item => [item.instanceId, item.firstFrame]),
  [['root/depth-297/generation-1', 6]]);
  assert.deepEqual(main.instances.filter(item =>
    [105, 106, 107, 110, 111].includes(item.characterId))
    .map(item => [item.characterId, item.depth, item.firstFrame,
      item.lastFrameExclusive]), [
    [105, 241, 1, 636], [106, 242, 1, 636],
    [106, 243, 1, 636], [106, 244, 1, 636],
    [107, 245, 1, 636], [110, 247, 1, 636], [111, 248, 1, 636],
  ]);
  assert.deepEqual(main.instances.filter(item => item.characterId === 232)
    .map(item => [item.instanceId, item.firstFrame,
      item.lastFrameExclusive]),
  [['sprite-246/depth-283/generation-2', 591, 636]]);
  const emphasis = main.instances.filter(item =>
    [228, 239].includes(item.characterId) &&
    item.depth === 286);
  assert.deepEqual(emphasis.map(item => [item.characterId,
    item.firstFrame, item.lastFrameExclusive]), [
    [228, 592, 593], [228, 594, 595],
    [239, 615, 616], [239, 617, 618], [239, 619, 620],
  ]);
  assert.deepEqual(main.instances.filter(item =>
    item.characterId === 228 && item.depth === 283)
    .map(item => [item.firstFrame, item.lastFrameExclusive]),
  [[590, 591]]);
  const mask = main.events.filter(item => item.kind === 'place' &&
    item.depth === 282 && item.characterId === 230);
  assert.deepEqual(mask.map(item => [item.frame, item.clipDepth,
    item.matrix[0]]), [
    [591, 284, 0.1842498779296875],
    [599, 284, 0.3858642578125],
    [605, 284, 0.508941650390625],
    [612, 284, 0.6667633056640625],
    [616, 284, 0.824951171875],
  ]);
  return Object.freeze({sourceSha256: SOURCE.sha256,
    sourceCatalogContentSha256: sha256(JSON.stringify(catalog)),
    formulaCharacterId: 232,
    formulaInstanceId: 'sprite-246/depth-283/generation-2',
    revealFrames: Object.freeze(mask.map(item => item.frame)),
    tankEmphasisFrames: Object.freeze([590, 592, 594]),
    addendEmphasisFrames: Object.freeze([615, 617, 619]),
    claimBoundary: 'source-structural plus local Canvas observations; original-runtime and typography pending'});
}

export async function validateP003ExportedScripts(scriptRoot) {
  const ordinary = await lstat(scriptRoot);
  assert(ordinary.isDirectory() && !ordinary.isSymbolicLink(),
    'ordinary FFDec script directory required');
  const entries = [];
  async function walk(folder, prefix = '') {
    for (const dirent of await readdir(folder, {withFileTypes: true})) {
      assert(!dirent.isSymbolicLink(), 'FFDec script symlink forbidden');
      const relative = path.join(prefix, dirent.name), full = path.join(folder, dirent.name);
      if (dirent.isDirectory()) await walk(full, relative);
      else {
        assert(dirent.isFile(), 'ordinary FFDec script file required');
        entries.push(relative);
      }
    }
  }
  await walk(scriptRoot);
  assert.deepEqual(entries.sort(), [...SCRIPT_FILES].sort(),
    'P003 FFDec script set drift');
  const scripts = new Map(await Promise.all(SCRIPT_FILES.map(async file =>
    [file, (await readFile(path.join(scriptRoot, file))).toString()])));
  assert.equal(scripts.get(SCRIPT_FILES[0]), PRELOADER);
  assert.equal(scripts.get(SCRIPT_FILES[1]), STOP);
  assert.equal(scripts.get(SCRIPT_FILES[2]), STOP);
  return Object.freeze({tool: 'FFDec 26.2.1 script:as export',
    scripts: SCRIPT_FILES.map(file => Object.freeze({path: file,
      sha256: sha256(Buffer.from(scripts.get(file)))})),
    claimBoundary: 'decompiled scripts are source-audit evidence, not original-runtime parity'});
}

const invoked = process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (invoked) {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  const ffdecRoot = process.argv[2];
  assert(sourceRoot && path.isAbsolute(sourceRoot) &&
    await realpath(sourceRoot) === sourceRoot,
  'HELP_MATH_G678_SOURCE_ROOT must be a real absolute directory');
  assert(ffdecRoot && path.isAbsolute(ffdecRoot),
    'pass an absolute FFDec export directory');
  const sourceFile = path.join(sourceRoot, SOURCE.path);
  const sourceStat = await lstat(sourceFile);
  assert(sourceStat.isFile() && !sourceStat.isSymbolicLink(),
    'ordinary P003 source file required');
  const bytes = await readFile(sourceFile);
  const structure = validateP003SourceStructure(bytes,
    parseSwfSourceFacts(bytes));
  const textSource = validateP003TextSource(bytes);
  const scripts = await validateP003ExportedScripts(
    path.join(ffdecRoot, 'scripts'));
  process.stdout.write(`${JSON.stringify({structure, textSource, scripts}, null, 2)}\n`);
}
