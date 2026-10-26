import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile, writeFile, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB04.swf';
const SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
const AUDIT_SHA = '362c4376b4c8bc2af9660ea197857d681c135827aae2e9afd525e70c38925938';
const hash = value => createHash('sha256').update(value).digest('hex');
const OUT = 'packages/demos/src/generated/alg-l12-p009-text-data.ts';

/** Complete-run reveal is a maintained typography decision, verified against
 * the separate glyph/mask audit. It is not a claim of Flash pixel parity. */
export const REVEAL = Object.freeze({
  4: [15, 25, 32, 36, 54, 59, 61, 65, 69],
  26: [85, 119, 128, 128],
  31: [162, 172, 201, 212],
  43: [223],
});

export function collectP009TextData(bytes, audit) {
  assert.equal(bytes.length, 165405);
  assert.equal(hash(bytes), SHA);
  assert.equal(audit.animationId, 'shared-alg001-l12-p009');
  assert.equal(audit.sourceSha256, SHA);
  const source = collectSwfTextSourceCatalog(bytes);
  assert.equal(source.textDefinitions.length, 16);
  const main = source.timelines.find(item => item.timelineId === 'sprite-62');
  assert.equal(main.declaredFrameCount, 394);
  const definitions = source.textDefinitions.map(definition => {
    assert.equal(definition.kind, 'static-text');
    const runs = definition.runs.map(run => {
      assert.equal(typeof run.text, 'string');
      const reveal = REVEAL[definition.characterId]?.[run.runIndex] ?? null;
      if (reveal !== null) {
        const evidence = audit.runInstanceVisibilitySummary.filter(row => row.sourceTextId === run.sourceTextId);
        assert.equal(evidence.length, 1);
        assert.equal(evidence[0].firstAllInkBoundsContainedFrame, reveal);
        assert.equal(evidence[0].literalText, run.text);
      }
      return {id: run.sourceTextId, text: run.text, color: run.colorRgba,
        fontHeightTwips: run.fontHeightTwips, revealFrame: reveal};
    });
    return {characterId: definition.characterId, sourceTagSha256: definition.sourceTagSha256,
      baselineTwips: [definition.runs[0].xOffsetTwips ?? 0, definition.runs[0].yOffsetTwips ?? 0],
      matrix: definition.matrix, boundsTwips: definition.boundsTwips, runs};
  });
  const textIds = new Set(definitions.map(item => item.characterId));
  const instances = main.instances.filter(instance => textIds.has(instance.characterId)).map(instance => {
    const events = instance.updates.map(id => {
      const event = main.events.find(item => item.eventId === id);
      assert(event);
      return {frame: event.frame, ...(event.matrix ? {matrix: event.matrix} : {}),
        ...(event.colorTransform ? {colorTransform: event.colorTransform} : {})};
    });
    assert(events[0].matrix, 'each text generation must have an explicit initial transform');
    return {instanceId: instance.instanceId, characterId: instance.characterId,
      depth: instance.depth, generation: instance.generation,
      firstFrame: instance.firstFrame, lastFrameExclusive: instance.lastFrameExclusive, events};
  });
  assert.equal(instances.length, 44);
  return {animationId: 'shared-alg001-l12-p009', sourceSha256: SHA,
    frameDomain: 'sprite-62', frameCount: 394, rootFrame: 6,
    rootTranslationTwips: [8248, 5666], definitions, instances};
}

async function main() {
  assert(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]));
  assert.equal(await realpath(SOURCE), SOURCE);
  const bytes = await readFile(SOURCE);
  const auditBytes = await readFile(path.join(ROOT, 'migrations/shared-alg001-l12-p009/audit/typography-source-inventory-v1.json'));
  assert.equal(hash(auditBytes), AUDIT_SHA, 'reviewed glyph/mask inventory changed');
  const data = collectP009TextData(bytes, JSON.parse(auditBytes));
  const result = '// Generated from the hash-bound P009 source; do not edit.\n' +
    `// Glyph/mask audit SHA-256: ${hash(auditBytes)}\n` +
    `export const P009_TEXT_DATA = ${JSON.stringify(data, null, 2)} as const;\n`;
  if (process.argv[2] === '--check') assert.equal(await readFile(path.join(ROOT, OUT), 'utf8'), result);
  else await writeFile(path.join(ROOT, OUT), result, {flag: 'wx'});
  console.log(JSON.stringify({file: OUT, bytes: Buffer.byteLength(result), sha256: hash(result), instances: data.instances.length}));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main().catch(error => {console.error(error); process.exitCode = 1;});
