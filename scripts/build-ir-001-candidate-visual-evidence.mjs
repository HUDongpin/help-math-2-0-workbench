#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PNG} from 'pngjs';

import {comparePngFiles} from './compare-images.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SCRIPT_PATH), '..');
const ANIMATION_ID = 'course-g04-l01-ir-001';
const FRAME_COUNT = 142;
const STAGE = Object.freeze({width: 800, height: 600});
const OUTPUT = 'migrations/course-g04-l01-ir-001/evidence/nextjs-native-candidate-visual-evidence.json';
const CAPTURE_ROOT = 'output/playwright/course-g04-l01-ir-001-next-candidate';

const SCENARIOS = Object.freeze([
  Object.freeze({
    id: 'sound-from-seed',
    seed: '0',
    directory: 'full-default-en',
    parts: Object.freeze([
      'part-001-036',
      'part-037-072',
      'part-073-108',
      'part-109-142'
    ])
  }),
  Object.freeze({
    id: 'sound-0',
    seed: '99',
    directory: 'full-sound-0-en',
    parts: Object.freeze([
      'part-001-036',
      'part-037-072',
      'part-073-108',
      'part-109-142'
    ])
  }),
  Object.freeze({
    id: 'sound-1',
    seed: '0',
    directory: 'full-sound-1-en',
    parts: Object.freeze([
      'canonical-part-001-024',
      'canonical-part-025-048',
      'canonical-part-049-072',
      'canonical-part-073-096',
      'canonical-part-097-120',
      'canonical-part-121-142'
    ])
  })
]);

const ALIGNMENTS = Object.freeze([
  Object.freeze({rootFrame: 1, expectedLocalFrame: 1, localStart: 1, localEnd: 1}),
  Object.freeze({rootFrame: 7, expectedLocalFrame: 23, localStart: 13, localEnd: 30}),
  Object.freeze({rootFrame: 8, expectedLocalFrame: 40, localStart: 31, localEnd: 50}),
  Object.freeze({rootFrame: 9, expectedLocalFrame: 56, localStart: 51, localEnd: 65}),
  Object.freeze({rootFrame: 10, expectedLocalFrame: 72, localStart: 66, localEnd: 80})
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function portable(value) {
  return value.split(path.sep).join('/');
}

function projectPath(relative) {
  const resolved = path.resolve(ROOT, relative);
  assert(resolved.startsWith(`${ROOT}${path.sep}`), `path escaped project root: ${relative}`);
  return resolved;
}

function relativeProject(absolute) {
  return portable(path.relative(ROOT, absolute));
}

function directoryDigest(frames) {
  return sha256(frames.map(({frame, sha256: digest}) => `${frame}\0${digest}\n`).join(''));
}

async function verifiedBytes(relative, expected, label) {
  const bytes = await readFile(projectPath(relative));
  const observed = sha256(bytes);
  assert(observed === expected, `${label}: expected ${expected}, observed ${observed}`);
  return {bytes, sha256: observed};
}

async function loadScenario(spec) {
  const byFrame = new Map();
  const manifests = [];
  for (const part of spec.parts) {
    const partDirectory = projectPath(`${CAPTURE_ROOT}/${spec.directory}/${part}`);
    const manifestPath = path.join(partDirectory, 'capture-manifest.json');
    const manifestBytes = await readFile(manifestPath);
    const manifest = JSON.parse(manifestBytes);
    assert(manifest.schemaVersion === 2 && manifest.status === 'complete', `${spec.id}/${part}: incomplete capture manifest`);
    assert(manifest.scenario === spec.id, `${spec.id}/${part}: scenario mismatch`);
    assert(manifest.language === 'en', `${spec.id}/${part}: language mismatch`);
    assert(String(manifest.seed) === spec.seed, `${spec.id}/${part}: seed mismatch`);
    assert(manifest.selector === '.faithful-stage-wrap', `${spec.id}/${part}: selector mismatch`);
    assert(manifest.reportedFrameAttribute === 'data-flash-frame', `${spec.id}/${part}: frame attribute mismatch`);
    assert(manifest.viewport?.width === 1280 && manifest.viewport?.height === 1000 && manifest.viewport?.deviceScaleFactor === 1, `${spec.id}/${part}: viewport mismatch`);
    for (const key of ['consoleErrors', 'failedRequests', 'httpErrors', 'unexpectedRequests']) {
      assert(Array.isArray(manifest[key]) && manifest[key].length === 0, `${spec.id}/${part}: ${key} is not empty`);
    }
    assert(manifest.error === null, `${spec.id}/${part}: capture error is not null`);
    assert(Array.isArray(manifest.captured) && manifest.captured.length > 0, `${spec.id}/${part}: no captured frames`);
    manifests.push({
      path: relativeProject(manifestPath),
      sha256: sha256(manifestBytes),
      capturedAt: manifest.capturedAt,
      frameCount: manifest.captured.length
    });
    for (const row of manifest.captured) {
      const frame = Number(row.frame);
      assert(Number.isSafeInteger(frame) && frame >= 1 && frame <= FRAME_COUNT, `${spec.id}/${part}: invalid frame ${row.frame}`);
      assert(Number(row.reportedFrame) === frame, `${spec.id}/${part}: frame ${frame} was not reported exactly`);
      assert(row.scenario === spec.id && row.language === 'en' && String(row.seed) === spec.seed, `${spec.id}/${part}: frame ${frame} context mismatch`);
      assert(row.width === STAGE.width && row.height === STAGE.height, `${spec.id}/${part}: frame ${frame} manifest dimensions changed`);
      assert(!byFrame.has(frame), `${spec.id}: duplicate frame ${frame}`);
      const file = path.join(partDirectory, row.file);
      const bytes = await readFile(file);
      const digest = sha256(bytes);
      assert(digest === row.sha256, `${spec.id}: frame ${frame} PNG hash mismatch`);
      const png = PNG.sync.read(bytes);
      assert(png.width === STAGE.width && png.height === STAGE.height, `${spec.id}: frame ${frame} is not native 800x600`);
      byFrame.set(frame, {
        frame,
        file: relativeProject(file),
        sha256: digest,
        width: png.width,
        height: png.height
      });
    }
  }

  assert(byFrame.size === FRAME_COUNT, `${spec.id}: expected ${FRAME_COUNT} frames, found ${byFrame.size}`);
  const frames = [];
  for (let frame = 1; frame <= FRAME_COUNT; frame += 1) {
    assert(byFrame.has(frame), `${spec.id}: missing frame ${frame}`);
    frames.push(byFrame.get(frame));
  }
  return {
    scenario: spec.id,
    language: 'en',
    seed: spec.seed,
    frameCount: frames.length,
    stage: STAGE,
    directorySha256: directoryDigest(frames),
    manifests,
    frames
  };
}

async function findAlignment(defaultFrames, spec) {
  const baselineFile = projectPath(
    `artifacts/full-frame/pilot-baselines/course-g04-l01-ir-001/adobe-flash-player-32-standalone-default/frame-${String(spec.rootFrame).padStart(4, '0')}.png`
  );
  const comparisons = [];
  for (let localFrame = spec.localStart; localFrame <= spec.localEnd; localFrame += 1) {
    const candidate = defaultFrames[localFrame - 1];
    const result = await comparePngFiles(baselineFile, projectPath(candidate.file));
    comparisons.push({localFrame, normalizedRmse: result.normalizedRmse});
  }
  comparisons.sort((left, right) => left.normalizedRmse - right.normalizedRmse || left.localFrame - right.localFrame);
  const best = comparisons[0];
  assert(best.localFrame === spec.expectedLocalFrame, `root frame ${spec.rootFrame}: best local frame changed to ${best.localFrame}`);

  const stem = `migrations/course-g04-l01-ir-001/evidence/candidate-standalone-alignment/root-${String(spec.rootFrame).padStart(4, '0')}-vs-local-${String(best.localFrame).padStart(4, '0')}`;
  const metricPath = projectPath(`${stem}.json`);
  const diffPath = projectPath(`${stem}-diff.png`);
  const metricBytes = await readFile(metricPath);
  const metric = JSON.parse(metricBytes);
  const diffBytes = await readFile(diffPath);
  assert(Math.abs(metric.normalizedRmse - best.normalizedRmse) < 1e-15, `root frame ${spec.rootFrame}: stored RMSE changed`);
  assert(metric.width === STAGE.width && metric.height === STAGE.height, `root frame ${spec.rootFrame}: stored dimensions changed`);
  return {
    rootFrame: spec.rootFrame,
    selectedLocalFrame: best.localFrame,
    searchedLocalFrames: {start: spec.localStart, endInclusive: spec.localEnd},
    normalizedRmse: best.normalizedRmse,
    atOrBelowStaticThreshold: best.normalizedRmse <= 0.05,
    topCandidates: comparisons.slice(0, 5),
    baselineFile: relativeProject(baselineFile),
    implementationFile: defaultFrames[best.localFrame - 1].file,
    metricFile: relativeProject(metricPath),
    metricSha256: sha256(metricBytes),
    diffFile: relativeProject(diffPath),
    diffSha256: sha256(diffBytes)
  };
}

async function buildReport() {
  const source = await Promise.all([
    verifiedBytes(
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.fla',
      'c4ba5fd0b37b1a1ad622f4fdf89295a6b76c820588a8000b239b0f4d68984fb9',
      'source FLA'
    ),
    verifiedBytes(
      'source-assets/flash/HELP MATH_ORIGINAL FILES/HELP_COURSES/ELMGR4/L1/IR/L1RW01.swf',
      'b21b16d1e5756820b5703136708f625dcc3a324d629b2337b1dc42af64559e46',
      'source SWF'
    )
  ]);
  const captures = [];
  for (const spec of SCENARIOS) captures.push(await loadScenario(spec));
  const defaultFrames = captures[0].frames;
  const visualDifferences = [];
  for (let frame = 1; frame <= FRAME_COUNT; frame += 1) {
    if (captures.some((capture) => capture.frames[frame - 1].sha256 !== defaultFrames[frame - 1].sha256)) {
      visualDifferences.push(frame);
    }
  }
  assert(visualDifferences.length === 0, `sound-branch visuals differ at frames ${visualDifferences.join(', ')}`);

  const alignments = [];
  for (const spec of ALIGNMENTS) alignments.push(await findAlignment(defaultFrames, spec));
  const runtimeManifestPath = projectPath('public/flash-assets/courses/course-g04-l01-ir-001/manifest.json');
  const runtimeManifestBytes = await readFile(runtimeManifestPath);
  const runtimeManifest = JSON.parse(runtimeManifestBytes);
  const runtimeBytes = await readFile(projectPath(runtimeManifest.output.script));
  assert(sha256(runtimeBytes) === runtimeManifest.output.sha256, 'generated Canvas runtime hash mismatch');
  assert(
    JSON.stringify(runtimeManifest.timeline?.supportedLanguages) === JSON.stringify(['en', 'es']),
    'generated Canvas runtime no longer exposes the source-shared visual for en/es'
  );
  assert(
    runtimeManifest.timeline?.visualLocalization ===
      'single-source-drawing-timeline-with-embedded-english-title-and-no-language-branch; es preserves source pixels without claiming translation',
    'generated Canvas runtime visual-localization disposition changed'
  );
  const adobeBaselinePath = projectPath('migrations/course-g04-l01-ir-001/baseline/adobe-flash-player-32-standalone-default.json');
  const adobeBaselineBytes = await readFile(adobeBaselinePath);

  return {
    schemaVersion: 1,
    animationId: ANIMATION_ID,
    evidenceType: 'engineering-candidate-full-frame-and-standalone-visual-cross-check',
    classification: 'engineering-candidate-not-strict-acceptance',
    generator: {
      path: relativeProject(SCRIPT_PATH),
      sha256: sha256(await readFile(SCRIPT_PATH))
    },
    source: {
      flaSha256: source[0].sha256,
      swfSha256: source[1].sha256,
      stage: STAGE,
      fps: 12,
      rootFrameCount: 10,
      localTimeline: {id: 'sprite-58', frameCount: FRAME_COUNT, terminalStopFrame: 142}
    },
    implementation: {
      renderer: 'Canvas from hash-bound allowlisted FFDec vector/text definitions',
      runtimeManifest: relativeProject(runtimeManifestPath),
      runtimeManifestSha256: sha256(runtimeManifestBytes),
      runtimeScript: runtimeManifest.output.script,
      runtimeScriptSha256: runtimeManifest.output.sha256,
      audioRendered: false,
      capturedLanguages: ['en'],
      sourceSharedUntranslatedVisualLanguages: runtimeManifest.timeline.supportedLanguages,
      spanishTranslationRendered: false
    },
    deterministicCapture: {
      requiredFrameAttribute: 'data-flash-frame',
      frameNumbering: 'one-indexed',
      stage: STAGE,
      fps: 12,
      totalCapturedFrames: captures.reduce((sum, capture) => sum + capture.frameCount, 0),
      expectedCapturedFrames: FRAME_COUNT * SCENARIOS.length,
      scenarios: captures,
      visualParityAcrossSoundBranches: visualDifferences.length === 0,
      visualDifferenceFrames: visualDifferences,
      interpretation: 'All three deterministic structural sound scenarios render the same 142 visual frames; the selected sound state differs, but both embedded streams are intentionally omitted.'
    },
    adobeStandaloneCrossCheck: {
      baselineManifest: relativeProject(adobeBaselinePath),
      baselineManifestSha256: sha256(adobeBaselineBytes),
      authority: 'untouched source SWF in Adobe Flash Player 32 standalone, standalone-default scenario only',
      staticThreshold: 0.05,
      allSelectedStatesAtOrBelowStaticThreshold: alignments.every((row) => row.atOrBelowStaticThreshold),
      alignments,
      interpretation: 'These are empirical visual-state alignments, not timing or frame-identity evidence. Adobe root-frame stepping allowed the nested sprite to advance between captures, while the modern contract addresses sprite-58 directly.'
    },
    acceptanceEffect: {
      strictAcceptance: 'none',
      statusPromotion: false,
      humanReview: false,
      ownerReview: false
    },
    unresolved: [
      'No authoritative Adobe/original-host traversal captures all 142 local frames for both random outcomes.',
      'The two embedded 11.233-second MP3 streams are omitted; language identity, listening, cue timing, synchronization, stop, and Replay remain unaccepted.',
      'The same untranslated source visual is addressable for en and es; Spanish translation, Spanish audio/host state, and bilingual parity remain unresolved.',
      'The InternalPreloader/course-shell contract and parent/global component state are not reconstructed.',
      'Human full-frame/diff review and owner acceptance remain pending.'
    ]
  };
}

async function main() {
  const report = await buildReport();
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  const outputPath = projectPath(OUTPUT);
  if (process.argv.includes('--check')) {
    assert((await readFile(outputPath, 'utf8')) === serialized, `${OUTPUT} is stale`);
  } else {
    await writeFile(outputPath, serialized);
  }
  console.log(JSON.stringify({
    output: OUTPUT,
    check: process.argv.includes('--check'),
    capturedFrames: report.deterministicCapture.totalCapturedFrames,
    allSelectedStatesAtOrBelowStaticThreshold: report.adobeStandaloneCrossCheck.allSelectedStatesAtOrBelowStaticThreshold,
    strictAcceptance: report.acceptanceEffect.strictAcceptance
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
