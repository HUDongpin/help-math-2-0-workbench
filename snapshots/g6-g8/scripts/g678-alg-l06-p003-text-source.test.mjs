import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, realpathSync} from 'node:fs';
import {test} from 'node:test';
import {ALG_L06_P003_TEXT_BINDING} from '../packages/demos/src/alg-l06-p003-text-v1.ts';
import {collectSwfTextSourceCatalog} from './lib/swf-text-source-catalog.mjs';

const swf = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L6/RW/L6RW03.swf';

test('P003 native text IDs, values and two placement eras match the physical source', () => {
  assert.equal(realpathSync(swf), swf);
  const raw = readFileSync(swf);
  assert.equal(createHash('sha256').update(raw).digest('hex'),
    ALG_L06_P003_TEXT_BINDING.sourceSwfSha256);
  const catalog = collectSwfTextSourceCatalog(raw);
  assert.equal(catalog.summary.unparsedTags, 0);
  const audit = JSON.parse(readFileSync(new URL('../migrations/shared-alg001-l06-p003/audit/source-readable-text-v1.json',
    import.meta.url), 'utf8'));
  assert.equal(createHash('sha256').update(JSON.stringify(catalog)).digest('hex'),
    audit.sourceCatalogContentSha256);
  assert.deepEqual(audit.blocks.map(block => block.id),
    ALG_L06_P003_TEXT_BINDING.blocks.map(block => block.id));
  const runs = new Map(catalog.textDefinitions.flatMap(definition =>
    definition.runs.map(run => [run.sourceTextId, run.text])));
  for (const block of ALG_L06_P003_TEXT_BINDING.blocks) {
    for (const id of block.sourceTextIds) assert.ok(runs.has(id), `missing source text: ${id}`);
  }
  assert.deepEqual([
    runs.get('character-24/run-0'), runs.get('character-25/run-0'),
    runs.get('character-27/run-0'), runs.get('character-28/run-0'),
    runs.get('character-125/run-0'),
  ], ['Lemonade: ', '50¢ per cup', 'orange juice:', '75¢ per cup', 'M = $0.50 ∙ C']);
  const main = catalog.timelines.find(timeline => timeline.timelineId === 'sprite-154');
  assert.ok(main);
  for (const characterId of [18, 20, 24, 25, 27, 28]) {
    const instances = main.instances.filter(instance => instance.characterId === characterId);
    assert.deepEqual(instances.map(instance => [instance.firstFrame,
      instance.lastFrameExclusive - 1]), [[1, 40], [41, 719]]);
  }
  const fullEquation = main.instances.find(instance => instance.characterId === 125);
  assert.deepEqual([fullEquation?.firstFrame, fullEquation?.lastFrameExclusive - 1],
    [531, 719]);
  for (const block of audit.blocks) {
    assert.equal(block.text, block.sourceTextIds.map(id => runs.get(id)).join('')
      .replace('juice:75', 'juice: 75'));
    const timeline = catalog.timelines.find(item => item.timelineId === block.timeline);
    assert.ok(timeline);
    for (const id of block.sourceTextIds) {
      const characterId = Number(id.match(/^character-(\d+)\/run-0$/u)?.[1]);
      const intervals = timeline.instances.filter(instance => instance.characterId === characterId)
        .sort((left, right) => left.firstFrame - right.firstFrame);
      let coveredThrough = block.firstFrame - 1;
      for (const instance of intervals) {
        if (instance.firstFrame <= coveredThrough + 1) {
          coveredThrough = Math.max(coveredThrough, instance.lastFrameExclusive - 1);
        }
      }
      assert.ok(coveredThrough >= block.lastFrame, `${id} has a placement gap`);
    }
  }
});
