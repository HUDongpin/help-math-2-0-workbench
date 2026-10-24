import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {Script} from 'node:vm';

import {loadAnimationModule} from '../src/animation-registry';
import {matchPrototype} from '../src/prototype-manifest';
import ir001, {
  COURSE_G05_L04_IR_001_A662633D_MOVIE,
  COURSE_G05_L04_IR_001_A662633D_RUNTIME,
  COURSE_G05_L04_IR_001_A662633D_SOURCE,
  getCourseG05L04Ir001A662633dFrameState
} from '../src/modules/course-g05-l04-ir-001-a662633d';
import {COURSE_G05_L04_IR_001_A662633D_CONFIG} from '../src/timelines/course-g05-l04-ir-001-a662633d';

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));
const sha256 = (bytes: Uint8Array) =>
  createHash('sha256').update(bytes).digest('hex');

test('G5 L4 IR001 exposes only the muted source-static visual timeline', async () => {
  assert.equal(ir001.key, 'course-g05-l04-ir-001-a662633d');
  assert.deepEqual(COURSE_G05_L04_IR_001_A662633D_MOVIE.stage, {
    width: 800,
    height: 600
  });
  assert.equal(COURSE_G05_L04_IR_001_A662633D_MOVIE.fps, 12);
  assert.equal(COURSE_G05_L04_IR_001_A662633D_MOVIE.frameCount, 136);
  assert.equal(COURSE_G05_L04_IR_001_A662633D_RUNTIME.frameCount, 10);
  assert.equal(
    COURSE_G05_L04_IR_001_A662633D_RUNTIME.defaultFrameDomain,
    'sprite-53'
  );
  assert.deepEqual(COURSE_G05_L04_IR_001_A662633D_RUNTIME.frameDomains, [
    {id: 'sprite-53', frameCount: 136, fps: 12, rootFrame: 6},
    {id: 'sprite-30', frameCount: 135, fps: 12, rootFrame: 6},
    {id: 'sprite-31', frameCount: 135, fps: 12, rootFrame: 6}
  ]);
  const prototype = matchPrototype({
    animationId: 'course-g05-l04-ir-001-a662633d'
  });
  assert.ok(prototype);
  assert.equal(prototype.runtime.defaultFrameDomain, 'sprite-53');
  assert.deepEqual(prototype.runtime.frameDomains, [
    {id: 'sprite-53', frameCount: 136, rootFrame: 6},
    {id: 'sprite-30', frameCount: 135, rootFrame: 6},
    {id: 'sprite-31', frameCount: 135, rootFrame: 6}
  ]);

  const ready = getCourseG05L04Ir001A662633dFrameState(136, {
    entryStateSha256: 'a'.repeat(64),
    frameDomain: 'sprite-53',
    lang: 'en',
    requirementId: 'engineering:course-g05-l04-ir-001-a662633d:muted-visual',
    scenario: 'source-static-frame',
    seed: 1,
    traceId: 'source-static:sprite-53'
  });
  assert.equal(ready.status, 'ready');
  assert.equal(ready.exportFrame, 135);
  assert.equal(ready.audioRendered, false);
  assert.equal(ready.sourceHostBehaviorResolved, false);
  assert.equal(ready.naturalRuntimeEstablished, false);

  for (const frameDomain of ['sprite-30', 'sprite-31'] as const) {
    const blocked = getCourseG05L04Ir001A662633dFrameState(1, {
      frameDomain,
      lang: 'en',
      scenario: `${frameDomain}-unavailable`,
      seed: 0
    });
    assert.equal(blocked.status, 'blocked');
    assert.equal(blocked.blocker, 'companion-domain-unrendered');
    assert.equal(blocked.audioRendered, false);
  }

  const spanish = getCourseG05L04Ir001A662633dFrameState(1, {
    frameDomain: 'sprite-53',
    lang: 'es',
    scenario: 'source-static-frame',
    seed: 0
  });
  assert.equal(spanish.status, 'blocked');
  assert.equal(spanish.blocker, 'spanish-visual-and-audio-unvalidated');
});

test('G5 L4 IR001 runtime is source-bound, safe, registered, and acceptance-neutral', async () => {
  const [sourceSwf, sourceFla, runtimeBytes, manifest, report] =
    await Promise.all([
      readFile(`${repositoryRoot}${COURSE_G05_L04_IR_001_A662633D_SOURCE.swf}`),
      readFile(`${repositoryRoot}${COURSE_G05_L04_IR_001_A662633D_SOURCE.fla}`),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g05-l04-ir-001-a662633d/canvas-renderer.js`
      ),
      readFile(
        `${repositoryRoot}public/flash-assets/courses/course-g05-l04-ir-001-a662633d/manifest.json`,
        'utf8'
      ).then(JSON.parse),
      readFile(
        `${repositoryRoot}migrations/course-g05-l04-ir-001-a662633d/evidence/source-static-current-js-candidate.json`,
        'utf8'
      ).then(JSON.parse)
    ]);
  assert.equal(
    sha256(sourceSwf),
    COURSE_G05_L04_IR_001_A662633D_SOURCE.swfSha256
  );
  assert.equal(
    sha256(sourceFla),
    COURSE_G05_L04_IR_001_A662633D_SOURCE.flaSha256
  );
  assert.equal(
    sha256(runtimeBytes),
    COURSE_G05_L04_IR_001_A662633D_CONFIG.assetSha256
  );
  assert.doesNotThrow(() => new Script(runtimeBytes.toString('utf8')));
  assert.equal(
    manifest.inputs.associatedAudio.kind,
    'embedded-swf-stream-container'
  );
  assert.equal(manifest.safety.audioRendered, false);
  assert.equal(manifest.safety.noLegacyActionScriptExecuted, true);
  assert.equal(manifest.safety.noNetworkPrimitives, true);
  assert.equal(report.browserQa.renderedFrameCount, 136);
  assert.equal(report.evidenceBoundary.originalRuntimeBaselineUsed, false);
  assert.equal(report.evidenceBoundary.humanVisualReviewPerformed, false);
  assert.equal(report.evidenceBoundary.ownerReviewPerformed, false);
  assert.ok(
    Object.values(report.acceptanceEffects).every((value) => value === false)
  );
  assert.equal(
    (await loadAnimationModule('course-g05-l04-ir-001-a662633d'))?.key,
    'course-g05-l04-ir-001-a662633d'
  );
});
