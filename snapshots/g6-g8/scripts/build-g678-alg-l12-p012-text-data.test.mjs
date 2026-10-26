import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {collectP012TextData, prepareP012TextData} from './build-g678-alg-l12-p012-text-data.mjs';

const root = new URL('../', import.meta.url);
const sourcePath = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/ALG001/L12/VB/L12VB07.swf';
const triage = 'output/p011-source-triage-20260927-v1/';
const bytes = readFileSync(sourcePath);
const catalog = JSON.parse(readFileSync(new URL(`${triage}source-text-catalog.json`, root)));
const structure = JSON.parse(readFileSync(new URL(`${triage}source-structure.json`, root)));
const actions = [
  'raw/actionscript/as/scripts/DefineSprite_86/frame_119/DoAction.as',
  'raw/actionscript/pcode/scripts/DefineSprite_86/frame_119/DoAction.pcode',
  'raw/actionscript/as/scripts/DefineSprite_74/frame_1/DoAction.as',
  'raw/actionscript/as/scripts/DefineSprite_76/frame_2/DoAction.as',
].map(relative => readFileSync(new URL(`${triage}${relative}`, root), 'utf8'));
const data = collectP012TextData(bytes, catalog, structure, actions);

test('P012 preserves every decoded source run and its text placement generation', () => {
  assert.equal(data.definitions.length, 37);
  assert.equal(data.definitions.flatMap(definition => definition.runs ?? []).length, 38);
  assert.equal(data.instances.length, 57);
  assert.equal(data.buttonStateTextInstances.length, 1);
  assert.equal(data.runInstances.length, 60);
  assert.equal(new Set(data.runInstances.map(pair => `${pair.instanceId}|${pair.sourceTextId}`)).size, 60);
  const byId = new Map(data.definitions.map(definition => [definition.characterId, definition]));
  assert.deepEqual(data.teachingText.intro, ['character-51/run-0', 'character-51/run-1',
    'character-51/run-2', 'character-55/run-0']);
  assert.equal(byId.get(51).runs.map(run => run.text).join(''),
    'Click the arrows to move the spider and change the coordinates. Then click ');
  assert.equal(byId.get(55).runs[0].text, 'Next to continue.');
  assert.deepEqual(data.teachingText.controls.map(control => control.text),
    ['up 3', 'up 1', 'right 1', 'left1', 'down 1', 'down 3', 'right 3', 'left3']);
  assert.equal(byId.get(73).runs[0].text, 'Keep the spider on the ceiling. Try again.');
  assert.equal(byId.get(75).runs[0].text, 'Coach_audio_1');
  assert.equal(data.buttonStateTextInstances[0].instanceId, 'button-71/record-4');
  assert.deepEqual(data.buttonStateTextInstances[0].states,
    {up: true, over: true, down: true, hitTest: false});
  assert.deepEqual(data.teachingText.coach.labels.map(label => [label.label, label.frame]),
    [['S1', 3], ['S2', 18], ['S3', 31], ['S4', 40]]);
});

test('P012 direct coordinate and nested interaction bubble have distinct transforms and frame domains', () => {
  const intro = data.instances.find(instance => instance.instanceId === data.dynamicCoordinate.introInstanceId);
  const nested = data.instances.find(instance => instance.instanceId === data.dynamicCoordinate.bubbleFieldInstanceId);
  const parent = data.parentPlacements.find(instance => instance.instanceId === data.dynamicCoordinate.bubbleParentInstanceId);
  assert.deepEqual([intro.timelineId, intro.firstFrame, intro.lastFrameExclusive], ['sprite-86', 1, 119]);
  assert.deepEqual(intro.poseSegments[0].pose.matrix,
    [1.95001220703125, 0, 0, 1.95001220703125, 2104, -463]);
  assert.deepEqual([nested.timelineId, nested.firstFrame, nested.lastFrameExclusive], ['sprite-61', 1, 2]);
  assert.deepEqual(nested.poseSegments[0].pose.matrix,
    [1.95001220703125, 0, 0, 1.95001220703125, -598, -227]);
  assert.deepEqual([parent.parentTimelineId, parent.firstFrame, parent.matrix],
    ['sprite-86', 119, [1, 0, 0, 1, 2702, -236]]);
  assert.equal(data.dynamicCoordinate.targetPath, 'mcOP.txtOP.text');
  assert.equal(data.dynamicCoordinate.expression, '"(" + _global.x + "," + _global.y + ")"');
  assert.equal(data.dynamicCoordinate.bubbleYFromSpiderPx, -29);
  for (const instance of data.instances) {
    assert.equal(instance.poseSegments[0].firstFrame, instance.firstFrame);
    assert.equal(instance.poseSegments.at(-1).lastFrameExclusive, instance.lastFrameExclusive);
    for (let index = 1; index < instance.poseSegments.length; index++)
      assert.equal(instance.poseSegments[index - 1].lastFrameExclusive, instance.poseSegments[index].firstFrame);
  }
});

test('P012 generator verifies physical inputs and rejects source or action drift', async () => {
  const prepared = await prepareP012TextData();
  assert.deepEqual(prepared.data, data);
  assert.equal(prepared.result, readFileSync(new URL('../packages/demos/src/generated/alg-l12-p012-text-data.ts', import.meta.url), 'utf8'));
  const changed = Buffer.from(bytes);
  changed[100] ^= 1;
  assert.throws(() => collectP012TextData(changed, catalog, structure, actions), /hash drift/);
  const altered = [...actions];
  altered[0] = altered[0].replace('McSpider._y - 29', 'McSpider._y - 28');
  assert.throws(() => collectP012TextData(bytes, catalog, structure, altered));
});
