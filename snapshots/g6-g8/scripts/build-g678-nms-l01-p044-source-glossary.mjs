#!/usr/bin/env node
// One source-derived glossary projection. No registration, route or host write.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstat, readFile, realpath, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {decodeGlossaryText, resolveSourceGlossary} from './build-g678-alg-l11-instructional-successor-glossary.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SELF = 'scripts/build-g678-nms-l01-p044-source-glossary.mjs';
export const TEST = 'scripts/build-g678-nms-l01-p044-source-glossary.test.mjs';
export const OUTPUT = 'catalog/g678-nms-l01-p044-source-glossary-v1.json';
export const MODULE = 'packages/demos/src/generated/g678-nms-l01-p044-source-glossary-v1.ts';
export const SOURCE = Object.freeze({path: 'G6-G8-shared/NMS002/L1/TS/L1TS08.swf', bytes: 657348,
  sha256: '8ad8df775eff49a3763f67e95fba4ed211e34912bd63f6602078119240fe6c76'});
export const XML = Object.freeze({
  en: {path: 'objects/sha256/14/14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b', bytes: 345838,
    sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  es: {path: 'objects/sha256/3b/3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407', bytes: 344456,
    sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
});
const pin = (file, bytes, sha256) => Object.freeze({path: file, bytes, sha256});
export const INPUTS = Object.freeze({
  parser: pin('scripts/build-g678-alg-l11-instructional-successor-glossary.mjs', 12493, '25c9aa4c25a4bc84539b080cebb8dfcbaee5f57189531c6798be14e87ac09d59'),
  recovery: pin('catalog/g678-ts07-l1-keyterm-recovery-v1.json', 174337, '78fda81f5336991b563d173d9266494f1d7e2f17812f6aa2a84506eadf6144f7'),
  freeze: pin('catalog/product-bridge-calibrations/g678-current-js-378-page-registration-v1.json', 2415408, 'cf4921508fcaff5270c2dc4a3bd2571397b9c456b0ff5c1cae46378081e71cf5'),
  crosscheck: pin('work/g678-shared-page-factory/g678-nms-l01-p044-structural-crosscheck-v4/crosscheck.json', 6640, 'eb32fbbdfca8d3c7fa5b7e23f582696e19f90ed4bc6188450c10c30684262820'),
});
export const CONTROLS = Object.freeze([
  [20, 'Total', 'total', 120, 'e0b105fe0e01a8668ef4a253de4aaba8205ed95aa1bac8a42559d026c01f7445'],
  [285, 'Multiplication', 'multiplication', 129, 'faa81f2224da41154cf050aa293d59a356dd7b53734d39246d6a468c178bddd2'],
  [286, 'Solve', 'solve', 120, 'f76c13ce6f90e077f716580e1f8349b40adcf7e54959e5a380af1c619bdd5be8'],
].map(([characterId, sourceKeyAttribute, termId, bytes, sha256]) => Object.freeze({characterId, sourceKeyAttribute, termId,
  script: pin(`work/g678-shared-page-factory/g678-nms-l01-p044-source-audit-v1/export/scripts/DefineButton2_${characterId}/BUTTONCONDACTION on(release).as`, bytes, sha256)})));
export const EFFECTS = Object.freeze({currentJavaScriptRegistered: false, hostIntegrated: false, sourceGeometryImplemented: false,
  productCalibrationPassed: false, authoritativeOriginalRuntime: false, visualFidelityAccepted: false, audioAccepted: false,
  humanVisualAccepted: false, ownerAccepted: false, strictComplete: false, released: false, published: false});
export const encode = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const binding = (file, bytes) => ({path: file, bytes: bytes.length, sha256: digest(bytes)});
export async function readBound(root, expected) {
  assert.ok(path.isAbsolute(root) && await realpath(root) === root);
  assert.ok(!path.isAbsolute(expected.path) && expected.path.split('/').every(part => part && part !== '.' && part !== '..'));
  const file = path.join(root, expected.path), before = await lstat(file, {bigint: true});
  assert.ok(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n && await realpath(file) === file, 'Ordinary canonical single-linked input required');
  const bytes = await readFile(file), after = await lstat(file, {bigint: true});
  for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs', 'mode', 'nlink']) assert.equal(before[key], after[key], 'Input changed during read');
  const actual = binding(expected.path, bytes);
  if (expected.sha256) assert.deepEqual(actual, expected, 'Exact source/code input drift');
  return {binding: actual, bytes};
}
export function validateGlossaryScript(text, key) {
  assert.equal(text.replace(/\r\n?/gu, '\n').trim(), `on(release){\n   _global.KeyAttribute = "${key}";\n   _root.DoHyperLinks();\n   _root.animation_mc.animation.stop();\n}`);
}

// ~LNG~ makes legacy element names invalid XML. Reuse the reviewed bounded
// record grammar, not an XML repair. Preserve exact entry hashes and companions.
export function sourceGlossary(xmlByLanguage, source) {
  const keys = CONTROLS.map(c => c.sourceKeyAttribute), entries = resolveSourceGlossary(xmlByLanguage, keys, source);
  const companions = {};
  for (const lang of ['en', 'es']) {
    companions[lang] = new Map();
    for (const match of xmlByLanguage[lang].matchAll(/<([^\s>]+~LNG~[^\s>]+)\s+([^>]*)>([\s\S]*?)<\/\1\s*>/gu)) {
      const attrs = Object.fromEntries([...match[2].matchAll(/([A-Za-z]+)\s*=\s*"([^"]*)"/gu)].map(m => [m[1], m[2]]));
      if (!keys.includes(attrs.ScreenkeyTerm)) continue;
      assert.ok(!companions[lang].has(attrs.ScreenkeyTerm), 'Ambiguous source companion record');
      assert.match(attrs.ExFileName ?? '', /^[A-Za-z0-9_-]+\.swf$/u);
      for (const attr of ['SubLinkEng', 'SubLinkSpan']) assert.equal(typeof attrs[attr], 'string');
      companions[lang].set(attrs.ScreenkeyTerm, {exampleSwf: attrs.ExFileName,
        subLinksEn: decodeGlossaryText(attrs.SubLinkEng).split('~').filter(Boolean),
        subLinksEs: decodeGlossaryText(attrs.SubLinkSpan).split('~').filter(Boolean)});
    }
  }
  return entries.map(entry => {
    const left = companions.en.get(entry.sourceKeyAttribute), right = companions.es.get(entry.sourceKeyAttribute);
    assert.ok(left && right); assert.deepEqual(left, right, 'Bilingual companion references disagree');
    return {...entry, legacyCompanionReferences: left};
  });
}
export function reconcileExisting(freeze, entries) {
  const old = new Map();
  for (const page of freeze.selectedPages.filter(p => p.stableLessonKey === 'shared-nms002-l01')) {
    for (const entry of page.glossaryEntries ?? []) {
      if (old.has(entry.id)) assert.deepEqual(old.get(entry.id), entry, 'Existing lesson glossary conflict');
      old.set(entry.id, entry);
    }
  }
  assert.equal(old.size, 20);
  const overlap = [], added = [];
  for (const {sourceEntrySha256, extractionLfNormalizedEntrySha256, ...entry} of entries) {
    if (old.has(entry.id)) {assert.deepEqual(entry, old.get(entry.id), 'Do not rewrite an existing lesson term'); overlap.push(entry.id);}
    else added.push(entry.id);
  }
  assert.deepEqual(overlap, ['solve']); assert.deepEqual(added, ['multiplication', 'total']);
  return {existingUniqueTerms: 20, candidateTerms: 3, overlappingIds: overlap, proposedAdditionalIds: added,
    proposedMergedUniqueTerms: 22, registeredGlossaryChanged: false};
}
export async function publish(outputs, {root = ROOT, check = false} = {}) {
  assert.deepEqual(outputs.map(([file]) => file), [OUTPUT, MODULE]);
  for (const [file, bytes] of outputs) {
    if (check) {
      const actual = await readBound(root, binding(file, bytes)); assert.equal((await lstat(path.join(root, file))).mode & 0o222, 0);
      assert.ok(actual.bytes.equals(bytes));
    } else {
      assert.equal(await realpath(path.dirname(path.join(root, file))), path.dirname(path.join(root, file)));
      await assert.rejects(lstat(path.join(root, file)), {code: 'ENOENT'}, 'Preserve any existing successful or partial packet');
    }
  }
  if (!check) for (const [file, bytes] of outputs) await writeFile(path.join(root, file), bytes, {flag: 'wx', mode: 0o444});
  return check ? 0 : outputs.length;
}
export async function build({mode = 'plan'} = {}) {
  assert.ok(['plan', 'write', 'check'].includes(mode));
  const registry = await readFile(path.join(ROOT, 'packages/demos/private-current-js-registry.json'));
  const inputFiles = [...Object.values(INPUTS), ...CONTROLS.map(c => c.script), {path: SELF}, {path: TEST}];
  const loaded = await Promise.all(inputFiles.map(p => readBound(ROOT, p))), byPath = new Map(loaded.map(r => [r.binding.path, r]));
  await readBound(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE);
  const recovery = JSON.parse(byPath.get(INPUTS.recovery.path).bytes), freeze = JSON.parse(byPath.get(INPUTS.freeze.path).bytes);
  const crosscheck = JSON.parse(byPath.get(INPUTS.crosscheck.path).bytes);
  assert.equal(crosscheck.sourceSha256, SOURCE.sha256); assert.equal(crosscheck.status, 'structural-crosscheck-with-uninterpreted-residual');
  const source = {}, xml = {}, xmlInputs = [];
  for (const lang of ['en', 'es']) {
    const row = recovery.selectedSources.find(s => s.localeRole === lang); assert.deepEqual(row.casObject, XML[lang]);
    const input = await readBound(process.env.PRIVATE_RECOVERY_CONTAINERS, XML[lang]); xmlInputs.push(input.binding);
    xml[lang] = input.bytes.toString('utf8'); source[lang] = {assetId: `G678L1KT${lang === 'en' ? 'E' : 'S'}01.xml`, path: row.reference, sha256: input.binding.sha256};
  }
  for (const control of CONTROLS) validateGlossaryScript(byPath.get(control.script.path).bytes.toString('utf8'), control.sourceKeyAttribute);
  const entries = sourceGlossary(xml, source), reconciliation = reconcileExisting(freeze, entries);
  const artifact = {schemaVersion: 1, artifactType: 'g678-nms-l01-p044-source-glossary-v1', animationId: 'shared-nms002-l01-p044',
    source: SOURCE, sourceInputs: loaded.map(r => r.binding), xmlInputs, controls: CONTROLS, entries, reconciliation,
    sourceAction: 'DoHyperLinks; main timeline stop', sourceResiduals: crosscheck.residuals,
    legacyCompanionDisposition: 'References preserved only; example SWFs, child links and original host stop/resume are not implemented by this projection.',
    parserBoundary: 'Hash-pinned reusable legacy record parser only; no ALG lesson authority or calibration is borrowed.', acceptanceEffects: EFFECTS};
  const moduleBytes = Buffer.from('// Generated by build-g678-nms-l01-p044-source-glossary.mjs; do not edit.\n' +
    `export const P044_SOURCE_GLOSSARY = ${JSON.stringify({animationId: artifact.animationId, source: SOURCE, controls: CONTROLS.map(({script, ...c}) => c), entries, acceptanceEffects: EFFECTS}, null, 2)} as const;\n`);
  artifact.generatedModule = binding(MODULE, moduleBytes);
  const outputs = [[OUTPUT, encode(artifact)], [MODULE, moduleBytes]];
  for (const input of loaded) await readBound(ROOT, input.binding);
  for (const [lang, expected] of Object.entries(XML)) {assert.ok(xml[lang]); await readBound(process.env.PRIVATE_RECOVERY_CONTAINERS, expected);}
  await readBound(process.env.HELP_MATH_G678_SOURCE_ROOT, SOURCE);
  assert.ok((await readFile(path.join(ROOT, 'packages/demos/private-current-js-registry.json'))).equals(registry));
  const filesWritten = mode === 'plan' ? 0 : await publish(outputs, {check: mode === 'check'});
  assert.ok((await readFile(path.join(ROOT, 'packages/demos/private-current-js-registry.json'))).equals(registry));
  return {mode, filesWritten, files: outputs.map(([p, b]) => binding(p, b)), ...reconciliation, acceptanceEffects: EFFECTS};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2); assert.ok(args.length <= 1 && (!args.length || ['--plan', '--write', '--check'].includes(args[0])));
  build({mode: args[0]?.slice(2) ?? 'plan'}).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => {console.error(e); process.exitCode = 1;});
}
