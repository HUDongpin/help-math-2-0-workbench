import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {build, sanitizeSvg, separateQuestionSvg} from './build-g678-alg-l11-tranche-d-instructional-visuals.mjs';

test('generator reproduces all 144 source visuals and the exact source-bound run', async () => {
  const {data} = await build({check: true});
  assert.equal(data.questions.length, 24); assert.equal(data.cards.length, 24);
  assert.equal(data.questions.reduce((count, q) => count + q.choices.length, 0), 96);
});

test('SVG sanitizer rejects executable, external, and unknown CSS content', () => {
  const safe = '<svg width="10" height="10"><g><use xlink:href="#shape"/></g><defs><g id="shape"><path d="M0 0L1 1"/></g></defs></svg>';
  assert.match(sanitizeSvg(safe, 'test-source'), /id="test-source-shape"/);
  for (const bad of ['<script/>', '<foreignObject/>', '<image/>', '<style>bad</style>', '<g onclick="run()"/>']) {
    assert.throws(() => sanitizeSvg(safe.replace('<defs>', bad+'<defs>'), 'test-source'));
  }
  assert.throws(() => sanitizeSvg(safe.replace('#shape','https://example.invalid/test.svg'), 'test-source'));
});

test('question splitter retains source graphs and every named non-host instructional element', async () => {
  const source = await readFile('work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-visuals-v3/p044/DefineSprite_1083/14.svg','utf8');
  const result = separateQuestionSvg(source, 13);
  assert.ok(result.promptCharacterIds.includes(265)); // Source number-line artwork.
  assert.ok(result.promptCharacterIds.includes(145)); // Source tick-label glyph.
  assert.equal(result.options.length, 4);
  const named = source.replace('ffdec:characterId="265"', 'id="authored-number-line" ffdec:characterId="265"');
  assert.ok(separateQuestionSvg(named, 13).svg.includes('id="authored-number-line"'));
  assert.throws(() => separateQuestionSvg(source.replace('id="A13Opt1"','id="unbound-option"'), 13));
});

test('Q23 distinct left bounds remain 1000 for B and 1200 for C in authored glyph placement', async () => {
  const base = 'work/g678-shared-page-factory/g678-alg-l11-tranche-d-instructional-visuals-v3/p044';
  const b = await readFile(`${base}/DefineSprite_385/1.svg`,'utf8');
  const c = await readFile(`${base}/DefineSprite_386/1.svg`,'utf8');
  // Text105 is the source 0 glyph; text138 is the source 2 glyph. The
  // second left-hand digit differs even though set-like token lists match.
  assert.match(b, /ffdec:characterId="105"[^>]*transform="matrix\([^)]*, 46\.05, -1\.4\)"/);
  assert.match(c, /ffdec:characterId="138"[^>]*transform="matrix\([^)]*, 45\.05, -2\.85\)"/);
});
