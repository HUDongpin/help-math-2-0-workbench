import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync} from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {P056_CHARACTER_SYMBOL_IDS, P056_SYMBOL_DEFS_SVG, P056_SYMBOL_SOURCE} from '../generated/nms-l02-p056-symbol-art-v1';
import {p056SourceSpriteFrame} from './shared-nms002-l02-p056-display-list';
import {p056SourceSpriteSvg} from './shared-nms002-l02-p056-svg';

test('P056 reusable SVG symbols cover every source display-list character', () => {
  const symbolIds = Object.values(P056_CHARACTER_SYMBOL_IDS);
  assert.equal(symbolIds.length, 19);
  assert.equal(P056_CHARACTER_SYMBOL_IDS[11], null);
  assert.equal(new Set(symbolIds).size, symbolIds.length);
  assert.equal(P056_SYMBOL_SOURCE.sourceSwfSha256,
    'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be');
  for (let frame = 1; frame <= 234; frame++) {
    const svg = p056SourceSpriteSvg(frame, 'p056-test-all');
    assert.equal((svg.match(/data-source-depth=/gu) ?? []).length,
      p056SourceSpriteFrame(frame).filter(layer => layer.characterId !== 11).length);
    for (const layer of p056SourceSpriteFrame(frame)) {
      assert.ok(Object.hasOwn(P056_CHARACTER_SYMBOL_IDS, layer.characterId));
    }
  }
  for (const id of symbolIds) if (id) assert.ok(P056_SYMBOL_DEFS_SVG.includes(`id="${id}"`));
});

test('P056 keeps source crop separate from the 800x600 root stage', () => {
  const cropped = p056SourceSpriteSvg(234, 'p056-crop', 'forensic-crop');
  assert.match(cropped, /viewBox="0 0 477\.5 383\.1"/u);
  assert.match(cropped, /translate\(359\.45 204\.2\)/u);
  assert.doesNotMatch(cropped, /<rect width="800"/u);
  const stage = p056SourceSpriteSvg(234, 'p056-stage');
  assert.match(stage, /viewBox="0 0 800 600"/u);
  assert.match(stage, /translate\(412\.4 283\.3\)/u);
  assert.match(stage, /<rect width="800" height="600" fill="#b8d8f7"\/>/u);
  for (const id of [20, 22]) {
    assert.match(stage, new RegExp(`data-source-character="${id}"`, 'u'));
  }
  assert.doesNotMatch(stage, /data-source-character="(?:18|19)"/u);
  assert.doesNotMatch(p056SourceSpriteSvg(31, 'p056-test'), /data-source-character="18"/u);
  assert.match(p056SourceSpriteSvg(32, 'p056-test'), /data-source-character="18"/u);
  assert.doesNotMatch(p056SourceSpriteSvg(33, 'p056-test'), /data-source-character="18"/u);
  assert.match(p056SourceSpriteSvg(42, 'p056-test'), /data-source-character="19"/u);
  assert.throws(() => p056SourceSpriteSvg(0, 'p056-test'), RangeError);
  assert.throws(() => p056SourceSpriteSvg(235, 'p056-test'), RangeError);
  assert.throws(() => p056SourceSpriteSvg(1, 'p056-test', 'other' as never), RangeError);
});

test('P056 SVG instances isolate all symbol IDs and local references', () => {
  const first = p056SourceSpriteSvg(32, 'p056-first');
  const second = p056SourceSpriteSvg(42, 'p056-second');
  const ids = (svg: string) => new Set([...svg.matchAll(/\sid="([^"]+)"/gu)].map(match => match[1]));
  const refs = (svg: string) => [
    ...[...svg.matchAll(/xlink:href="#([^"]+)"/gu)].map(match => match[1]),
    ...[...svg.matchAll(/url\(#([^\)]+)\)/gu)].map(match => match[1]),
  ];
  const firstIds = ids(first);
  const secondIds = ids(second);
  assert.equal([...firstIds].filter(id => secondIds.has(id)).length, 0);
  for (const ref of refs(first)) assert.ok(firstIds.has(ref), ref);
  for (const ref of refs(second)) assert.ok(secondIds.has(ref), ref);
  assert.throws(() => p056SourceSpriteSvg(1, 'not:safe'), RangeError);
});

test('exact source regenerates SVG symbols byte-for-byte without overwrite', t => {
  const sourceRoot = process.env.HELP_MATH_G678_SOURCE_ROOT;
  if (!sourceRoot) { t.skip('real G6–G8 source root required'); return; }
  assert.equal(sourceRoot,
    '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware');
  const sourceStat = lstatSync(sourceRoot);
  assert.ok(sourceStat.isDirectory() && !sourceStat.isSymbolicLink());
  const script = new URL('../../../../scripts/build-nms-l02-p056-symbol-art-v1.mjs', import.meta.url);
  const generated = new URL('../generated/nms-l02-p056-symbol-art-v1.ts', import.meta.url);
  const before = createHash('sha256').update(readFileSync(generated)).digest('hex');
  const env = {...process.env, HELP_MATH_G678_SOURCE_ROOT: sourceRoot};
  const check = spawnSync(process.execPath, [fileURLToPath(script), '--check'], {env, encoding: 'utf8'});
  assert.equal(check.status, 0, check.stderr);
  const overwrite = spawnSync(process.execPath, [fileURLToPath(script), '--write'], {env, encoding: 'utf8'});
  assert.notEqual(overwrite.status, 0);
  assert.match(overwrite.stderr, /EEXIST/u);
  assert.equal(createHash('sha256').update(readFileSync(generated)).digest('hex'), before);
});
