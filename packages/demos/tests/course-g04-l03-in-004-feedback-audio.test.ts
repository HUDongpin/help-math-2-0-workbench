import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import module from '../src/modules/course-g04-l03-in-004';

test('IN004 feedback assets bind exactly to the three corresponding SWF streams', () => {
  const archive = JSON.parse(readFileSync(new URL('../../../reports/g4-l3-embedded-audio-archive.json', import.meta.url), 'utf8'));
  const page = archive.items.find((item: {animationId: string}) => item.animationId === module.key);
  const domains = ['sprite-55', 'sprite-155', 'sprite-159'];
  assert.equal(module.interactiveAudioAssets.length, 3);
  for (const [index, asset] of module.interactiveAudioAssets.entries()) {
    const stream = page.embeddedAudio.soundStreams.find((item: {ownerDomainId: string}) => item.ownerDomainId === domains[index]);
    const assetPath = asset.source.split('?')[0]!.replace('/flash-assets/', '');
    const bytes = readFileSync(new URL(`../../../public/flash-assets/${assetPath}`, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), stream.payload.sha256);
    assert.equal(asset.sha256, stream.payload.sha256);
    assert.equal(asset.activation, 'interaction-feedback');
    assert.equal(asset.source.split('?')[1], `sha256=${asset.sha256}`);
  }
});

test('IN004 declares bounded audio and Key Terms without restarting the introduction', () => {
  assert.deepEqual(module.lessonHost.capabilities, ['audio', 'keyterm']);
  const intro = module.audioCues.find((cue) => cue.frameDomain === 'sprite-160');
  assert.ok(intro);
  assert.equal(intro.frame, 7);
  assert.equal(intro.endFrame, 126);
});
