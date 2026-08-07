import assert from 'node:assert/strict';
import test from 'node:test';

import {PNG} from 'pngjs';

import {
  checkCandidateDiagnostics,
  computeNormalizedRgbMetrics,
  evaluateSemanticRegions,
  parseArguments,
} from './build-legacy-root-candidate-diagnostics.mjs';

function solid(width, height, color) {
  const image = new PNG({width, height});
  for (let index = 0; index < image.data.length; index += 4) {
    image.data[index] = color[0];
    image.data[index + 1] = color[1];
    image.data[index + 2] = color[2];
    image.data[index + 3] = 255;
  }
  return image;
}

test('candidate diagnostic CLI exposes only build, check, and help modes', () => {
  assert.deepEqual(parseArguments([]), {check: false});
  assert.deepEqual(parseArguments(['--check']), {check: true});
  assert.deepEqual(parseArguments(['--help']), {check: false, help: true});
  assert.throws(() => parseArguments(['--accept']), /Unknown argument/);
});

test('computes normalized RGB RMSE without diluting it with opaque alpha', () => {
  const baseline = solid(1, 1, [0, 0, 0]);
  const implementation = solid(1, 1, [255, 0, 0]);
  const result = computeNormalizedRgbMetrics(baseline, implementation);
  assert.ok(Math.abs(result.normalizedRmse - 1 / Math.sqrt(3)) < 1e-15);
  assert.equal(result.exactRgbMismatchedPixels, 1);
  assert.deepEqual(result.differenceBounds, {x: 0, y: 0, width: 1, height: 1});
});

test('flags configured text occupancy loss independently of aggregate RMSE status', () => {
  const baseline = solid(10, 10, [184, 216, 247]);
  const implementation = solid(10, 10, [184, 216, 247]);
  for (let y = 2; y < 6; y += 1) {
    for (let x = 2; x < 7; x += 1) {
      const offset = (y * baseline.width + x) * 4;
      baseline.data[offset] = 0;
      baseline.data[offset + 1] = 0;
      baseline.data[offset + 2] = 0;
    }
  }
  const evaluations = evaluateSemanticRegions({
    framesByNumber: new Map([[1, {baselineImage: baseline, implementationImage: implementation}]]),
    regions: [{
      id: 'instruction',
      category: 'text',
      frames: [1],
      bounds: {x: 0, y: 0, width: 10, height: 10},
      signal: {kind: 'dark-rgb', maximumLuminance: 130},
      minimumBaselinePixels: 10,
      minimumImplementationToBaselineRatio: 0.65,
    }],
  });
  assert.equal(evaluations.length, 1);
  assert.equal(evaluations[0].semanticRisk, true);
  assert.equal(evaluations[0].result, 'candidate-content-or-layer-loss-risk');
  assert.equal(evaluations[0].baselineSignalPixels, 20);
  assert.equal(evaluations[0].implementationSignalPixels, 0);
});

test('checked-in 115-frame report and selected artifacts rehash exactly and remain candidate-only', async () => {
  const {report} = await checkCandidateDiagnostics();
  assert.equal(report.summary.animationCount, 7);
  assert.equal(report.summary.pairedFrameCount, 115);
  assert.equal(report.summary.metricPassCount, 115);
  assert.equal(report.summary.metricFailureCount, 0);
  assert.equal(report.authorityBoundary.candidateOnly, true);
  assert.equal(report.authorityBoundary.currentTraceBoundOriginalRuntimeAuthority, false);
  assert.equal(report.authorityBoundary.strictAcceptanceEffect, false);
  assert.equal(report.summary.candidateVisualAcceptanceGranted, false);
});

