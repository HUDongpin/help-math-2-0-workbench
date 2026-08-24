import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import {
  hasAnimationModule,
  loadAnimationModule,
} from '../src/animation-registry';
import {
  createCourseG04L03SourceGlossaryOpenResult,
} from '../src/timelines/course-g04-l03-source-glossary-interaction';
import {
  COURSE_G03_L02_RW_002_GLOSSARY_CONFIG,
} from '../src/timelines/course-g03-l02-rw-002';

const ROOT = path.resolve(import.meta.dirname, '../../..');

test('all 70 G3 L2 page-only candidates load from the registry', async () => {
  const receipt = JSON.parse(await readFile(
    path.join(ROOT, 'reports/g3-l2-current-js-candidate-build.json'),
    'utf8',
  ));
  assert.equal(receipt.outputs.length, 70);
  let audioCandidateCount = 0;
  for (const output of receipt.outputs) {
    assert.equal(hasAnimationModule(output.animationId), true);
    const module = await loadAnimationModule(output.animationId);
    assert.ok(module);
    assert.equal(module.key, output.animationId);
    assert.equal(module.maturity, 'legacy-prototype');
    assert.equal(module.movie.stage.width, 800);
    assert.equal(module.movie.stage.height, 600);
    assert.equal(
      module.scenarios.some((scenario) => scenario.id === 'source-static-frame'),
      true,
    );
    if (module.audioTracks?.length) {
      audioCandidateCount += 1;
      assert.equal(module.audioTracks.length, 1);
      const track = module.audioTracks[0]!;
      assert.equal(track.language, 'shared');
      assert.equal(track.spokenLanguage, 'undetermined');
      assert.deepEqual(track.visibleWhen, ['en', 'es']);
      assert.equal(track.activation, 'user');
      assert.equal(track.timelineBehavior, 'none');
    }
  }
  assert.equal(audioCandidateCount, 62);
});

test('RW002 converts only the source-proven stable Number window into a typed keyterm request', () => {
  assert.equal(
    createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G03_L02_RW_002_GLOSSARY_CONFIG,
      frame: 731,
      lang: 'en',
      termId: 'number',
    }),
    null,
  );
  const result = createCourseG04L03SourceGlossaryOpenResult({
    config: COURSE_G03_L02_RW_002_GLOSSARY_CONFIG,
    frame: 732,
    lang: 'en',
    termId: 'number',
  });
  assert.deepEqual(result?.request, {
    type: 'open-keyterm',
    entryId: 'en-0423-3bcf1a5c2467',
    sourceAnimationId: 'course-g03-l02-rw-002',
    playbackDisposition:
      'source-stop-timeline-and-audio-until-explicit-resume',
  });
  assert.equal(result?.sourceAction, 'DoHyperLinks');
  assert.equal(result?.sourceStopTarget, '_root.animation_mc.animation.stop()');
  assert.equal(
    createCourseG04L03SourceGlossaryOpenResult({
      config: COURSE_G03_L02_RW_002_GLOSSARY_CONFIG,
      frame: 1057,
      lang: 'en',
      termId: 'number',
    }),
    null,
  );
});
