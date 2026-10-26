import assert from 'node:assert/strict';
import test from 'node:test';
import {feedbackHostScorePreviewLaunch, FEEDBACK_HOST_SCORE_PREVIEW_PHASE, FEEDBACK_HOST_SCORE_PREVIEW_PREFLIGHT}
  from './run-g678-feedback-host-score-local-preview.mjs';

test('dual successor preview remains loopback-only and checks exact V3 activation without writes', () => {
  const launch = feedbackHostScorePreviewLaunch({port: 3324});
  assert.ok(launch.args.includes('--webpack'));
  assert.equal(launch.args[launch.args.indexOf('--hostname') + 1], '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW, 'true');
  assert.equal(launch.env.HELP_MATH_G678_LOCAL_PREVIEW_BIND, '127.0.0.1');
  assert.equal(launch.env.HELP_MATH_G678_CALIBRATION_PHASE, FEEDBACK_HOST_SCORE_PREVIEW_PHASE);
  assert.deepEqual(FEEDBACK_HOST_SCORE_PREVIEW_PREFLIGHT, [
    ['scripts/activate-g678-alg-l11-feedback-host-score-registration.mjs', '--check'],
    ['packages/demos/scripts/generate-registry.mjs', '--check'],
  ]);
  assert.equal(FEEDBACK_HOST_SCORE_PREVIEW_PREFLIGHT.flat().includes('--write'), false);
});
