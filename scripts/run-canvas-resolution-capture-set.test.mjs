import assert from 'node:assert/strict';
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import {
  authorityEffects,
  captureBackingFixture,
  decodePng,
  makeHashBoundDocument,
  verifyHashBoundDocument,
  writeOrCheckHashBoundReport,
} from './canvas-backing-image.mjs';
import {
  CAPTURE_SET_PLAN_ARTIFACT,
  CAPTURE_SET_REPORT_ARTIFACT,
  CONTACT_SHEET_INDEX_ARTIFACT,
  CONTACT_SHEET_MANIFEST_ARTIFACT,
  PLACEMENT_PROBE_ARTIFACT,
  buildContactSheetIndex,
  composeContactSheetImage,
  createCaptureSetPlan,
  executeCaptureSetPlan,
  extractCanvasRuntimeMetadata,
  parseArguments,
  resolveProductionPlacements,
  verifyCompletedCaptureSet,
} from './run-canvas-resolution-capture-set.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(scriptDirectory, '..');
const TEST_ROOT = path.join(PROJECT_ROOT, 'work');

async function temporaryDirectory(t) {
  await mkdir(TEST_ROOT, {recursive: true});
  const root = await mkdtemp(path.join(TEST_ROOT, '.resolution-capture-set-test-'));
  t.after(async () => rm(root, {recursive: true, force: true}));
  return root;
}

function requirement(overrides = {}) {
  return {
    requirementId: 'req:root:default:en',
    frameDomainId: 'sprite-1',
    traceId: 'trace:root:default:en:seed-0',
    entryStateSha256: 'a'.repeat(64),
    scenario: 'default',
    language: 'en',
    seed: '0',
    firstFrame: 1,
    lastFrame: 1,
    thresholdClass: 'static',
    ...overrides,
  };
}

function fixtureContract(overrides = {}) {
  return {
    rendererCount: 2,
    placementCount: 3,
    nativeWidth: 1,
    nativeHeight: 1,
    contactSheetTileLimit: 2,
    placementProbeLocales: ['en', 'es'],
    approvedReleaseIds: ['fixture-release'],
    ...overrides,
  };
}

function fixtureProfileBinding(root) {
  const document = {
    profileId: 'fixture-v2',
    checksumSetSha256: 'b'.repeat(64),
  };
  const bytes = Buffer.from(JSON.stringify(document));
  return {
    path: path.join(root, 'profile.json'),
    bytes,
    sha256: 'c'.repeat(64),
    document,
  };
}

function rendererRecord(root, animationId, releaseId = 'fixture-release', requirements = [requirement()]) {
  return {
    animationId,
    releaseId,
    profileEntry: {
      assetPath: `courses/${animationId}/canvas-renderer.js`,
      relativePath: `${animationId}/canvas-renderer.js`,
      storageRoot: 'public',
      releaseId,
      bytes: 1,
      sha256: 'd'.repeat(64),
    },
    rendererFile: {
      path: path.relative(PROJECT_ROOT, path.join(root, `${animationId}.js`)),
      bytes: 1,
      sha256: 'd'.repeat(64),
    },
    requirementSource: {
      kind: 'fixture',
      path: path.relative(PROJECT_ROOT, path.join(root, `${animationId}.json`)),
      bytes: 1,
      sha256: 'e'.repeat(64),
    },
    requirements,
  };
}

function placement({
  animationId,
  ordinal,
  placementId = null,
  releaseId = 'fixture-release',
}) {
  return {
    placementKey: placementId ?? `${releaseId}-ordinal-${String(ordinal).padStart(3, '0')}`,
    placementId,
    releaseId,
    grade: 5,
    lesson: 3,
    ordinal,
    animationId,
    xmlOccurrence: ordinal,
    source: {path: `${animationId}.swf`, sha256: 'f'.repeat(64)},
  };
}

test('production release catalogs resolve exactly 283 renderers / 284 source-ordered placements and retain both IN028 identities', async () => {
  const [main, pageOnly] = await Promise.all([
    readFile(path.join(PROJECT_ROOT, 'catalog/lesson-releases.json'), 'utf8'),
    readFile(
      path.join(PROJECT_ROOT, 'catalog/page-only-current-js-product-releases.json'),
      'utf8',
    ),
  ]);
  const placements = resolveProductionPlacements({
    releaseCatalogDocuments: [JSON.parse(main), JSON.parse(pageOnly)],
  });
  assert.equal(placements.length, 284);
  assert.equal(new Set(placements.map(({animationId}) => animationId)).size, 283);
  assert.deepEqual(
    placements.filter(({animationId}) =>
      animationId === 'course-g05-l03-in-028').map((item) => ({
      ordinal: item.ordinal,
      placementId: item.placementId,
    })),
    [
      {ordinal: 45, placementId: 'g05-l03-placement-045'},
      {ordinal: 46, placementId: 'g05-l03-placement-046'},
    ],
  );
  assert.equal(
    placements.some(({animationId}) => animationId.includes('-index-')),
    false,
  );
});

test('plan expands renderer requirements once and maps repeated placements without duplicating renderer captures', async (t) => {
  const root = await temporaryDirectory(t);
  const rendererA = 'course-g05-l03-in-028';
  const rendererB = 'course-g05-l03-in-027';
  const plan = createCaptureSetPlan({
    projectRoot: PROJECT_ROOT,
    baseUrl: 'https://preview.example.test/',
    baselineRoot: path.relative(PROJECT_ROOT, path.join(root, 'baseline')),
    outputRoot: path.relative(PROJECT_ROOT, path.join(root, 'output')),
    profileBinding: fixtureProfileBinding(root),
    rendererRecords: [
      rendererRecord(root, rendererA, 'fixture-release', [
        requirement({lastFrame: 3}),
      ]),
      rendererRecord(root, rendererB),
    ],
    placements: [
      placement({animationId: rendererB, ordinal: 44}),
      placement({
        animationId: rendererA,
        ordinal: 45,
        placementId: 'g05-l03-placement-045',
      }),
      placement({
        animationId: rendererA,
        ordinal: 46,
        placementId: 'g05-l03-placement-046',
      }),
    ],
    contract: fixtureContract(),
  });
  verifyHashBoundDocument(plan, CAPTURE_SET_PLAN_ARTIFACT);
  assert.deepEqual(plan.payload.summary, {
    rendererCount: 2,
    placementCount: 3,
    requirementCount: 2,
    stateCount: 4,
    candidateBackingCaptureCount: 8,
    k1ParityComparisonCount: 4,
    k2ScaleComparisonCount: 4,
    placementProbeCount: 6,
    repeatedRendererPlacementCount: 1,
  });
  const in028 = plan.payload.renderers.find(
    ({animationId}) => animationId === rendererA,
  );
  assert.equal(in028.stateCount, 3);
  assert.equal(in028.contactSheets.length, 2);
  assert.equal(in028.contactSheets[0].tiles.length, 2);
  assert.equal(in028.contactSheets[1].tiles.length, 1);
  const repeated = plan.payload.placements.filter(
    ({animationId}) => animationId === rendererA,
  );
  assert.deepEqual(
    repeated.map(({placementId}) => placementId),
    ['g05-l03-placement-045', 'g05-l03-placement-046'],
  );
  assert.equal(repeated[0].rendererReport, repeated[1].rendererReport);
  assert.notEqual(repeated[0].placementReport, repeated[1].placementReport);
  assert.match(in028.states[0].captureUrl, /capture=1/u);
  assert.match(in028.states[0].captureUrl, /requirementId=req%3Aroot/u);
  const index = buildContactSheetIndex(plan);
  verifyHashBoundDocument(index, CONTACT_SHEET_INDEX_ARTIFACT);
  assert.equal(index.payload.summary.rendererCount, 2);
  assert.equal(index.payload.summary.sheetCount, 3);
});

test('plan fails closed on missing requirements, missing renderer bindings, or duplicate placement keys', async (t) => {
  const root = await temporaryDirectory(t);
  const contract = fixtureContract({rendererCount: 1, placementCount: 1});
  const common = {
    projectRoot: PROJECT_ROOT,
    baseUrl: 'https://preview.example.test/',
    baselineRoot: path.relative(PROJECT_ROOT, path.join(root, 'baseline')),
    outputRoot: path.relative(PROJECT_ROOT, path.join(root, 'output')),
    profileBinding: fixtureProfileBinding(root),
    contract,
  };
  assert.throws(
    () => createCaptureSetPlan({
      ...common,
      rendererRecords: [rendererRecord(root, 'course-g05-l03-in-001', 'fixture-release', [])],
      placements: [placement({animationId: 'course-g05-l03-in-001', ordinal: 1})],
    }),
    /no capture requirements/u,
  );
  assert.throws(
    () => createCaptureSetPlan({
      ...common,
      rendererRecords: [rendererRecord(root, 'course-g05-l03-in-001')],
      placements: [placement({animationId: 'course-g05-l03-in-002', ordinal: 1})],
    }),
    /no profile-bound renderer/u,
  );
  assert.throws(
    () => createCaptureSetPlan({
      ...common,
      contract: fixtureContract({rendererCount: 1, placementCount: 2}),
      rendererRecords: [rendererRecord(root, 'course-g05-l03-in-001')],
      placements: [
        placement({animationId: 'course-g05-l03-in-001', ordinal: 1}),
        placement({animationId: 'course-g05-l03-in-001', ordinal: 1}),
      ],
    }),
    /placement keys are duplicated|placement identities/u,
  );
});

test('runtime metadata parser accepts strict generated JSON and rejects identity/stage drift', () => {
  const id = 'course-g03-l02-in-002';
  const metadata = {
    schemaVersion: 1,
    animationId: id,
    stage: {width: 800, height: 600},
    deterministicContentTimeline: {timelineId: 'sprite-10', frameCount: 3},
    scenarios: ['source-static-frame'],
    supportedLanguages: ['en'],
  };
  const bytes = Buffer.from(
    `var METADATA = deepFreeze(${JSON.stringify(metadata)});`,
  );
  assert.deepEqual(extractCanvasRuntimeMetadata(bytes, id), metadata);
  assert.throws(
    () => extractCanvasRuntimeMetadata(bytes, 'course-g03-l02-in-003'),
    /identity mismatch/u,
  );
  assert.throws(
    () => extractCanvasRuntimeMetadata(Buffer.from(
      `var METADATA = deepFreeze(${JSON.stringify({
        ...metadata,
        stage: {width: 801, height: 600},
      })});`,
    ), id),
    /stage must be 800x600/u,
  );
});

test('contact sheet compositor is deterministic, preserves layout, and composites alpha over white', () => {
  const first = {
    width: 2,
    height: 1,
    data: Buffer.from([
      10, 20, 30, 255,
      20, 40, 60, 128,
    ]),
  };
  const second = {
    width: 1,
    height: 1,
    data: Buffer.from([90, 80, 70, 255]),
  };
  const layout = {
    schemaVersion: 1,
    algorithm: 'nearest-rgba-over-white-v1',
    tileWidth: 2,
    tileHeight: 1,
    columns: 2,
    padding: 1,
    background: [1, 2, 3, 255],
  };
  const left = composeContactSheetImage([first, second], layout);
  const right = composeContactSheetImage([first, second], layout);
  assert.equal(left.image.width, 7);
  assert.equal(left.image.height, 3);
  assert.deepEqual(left.placements, [
    {index: 0, row: 0, column: 0, x: 1, y: 1, width: 2, height: 1},
    {index: 1, row: 0, column: 1, x: 4, y: 1, width: 2, height: 1},
  ]);
  assert.deepEqual(left, right);
  const transparentPixelOffset = (1 * left.image.width + 2) * 4;
  assert.deepEqual(
    [...left.image.data.subarray(
      transparentPixelOffset,
      transparentPixelOffset + 4,
    )],
    [137, 147, 157, 255],
  );
});

test('CLI defaults to plan and rejects conflicting modes or missing preview identity', () => {
  const parsed = parseArguments([
    '--base-url', 'https://preview.example.test',
  ]);
  assert.equal(parsed.mode, 'plan');
  assert.equal(parsed.browserName, 'chromium');
  assert.throws(() => parseArguments([]), /--base-url is required/u);
  assert.throws(
    () => parseArguments([
      '--base-url', 'https://preview.example.test',
      '--plan',
      '--execute',
    ]),
    /only one/u,
  );
  assert.throws(
    () => parseArguments([
      '--base-url', 'https://preview.example.test',
      '--browser', 'unknown',
    ]),
    /chromium, firefox, or webkit/u,
  );
});

test('execution preflights baseline, drives capture/parity/scale, writes placement and aggregate closure, and --check revalidates it', async (t) => {
  const root = await temporaryDirectory(t);
  const animationId = 'course-g05-l03-in-001';
  const contract = fixtureContract({
    rendererCount: 1,
    placementCount: 1,
    placementProbeLocales: ['en'],
  });
  const plan = createCaptureSetPlan({
    projectRoot: PROJECT_ROOT,
    baseUrl: 'https://preview.example.test/',
    baselineRoot: path.relative(PROJECT_ROOT, path.join(root, 'baseline')),
    outputRoot: path.relative(PROJECT_ROOT, path.join(root, 'output')),
    profileBinding: fixtureProfileBinding(root),
    rendererRecords: [rendererRecord(root, animationId)],
    placements: [placement({animationId, ordinal: 1})],
    contract,
  });
  const state = plan.payload.renderers[0].states[0];
  const baselineInput = path.join(root, 'baseline-input.rgba');
  await writeFile(baselineInput, Buffer.from([40, 50, 60, 255]));
  await captureBackingFixture({
    projectRoot: PROJECT_ROOT,
    inputPath: baselineInput,
    inputFormat: 'rgba',
    outputDirectory: path.dirname(state.baselineManifest),
    identity: state.identity,
    stageWidth: 1,
    stageHeight: 1,
    scale: 1,
  });

  let captureCalls = 0;
  const captureRunner = async (options) => {
    captureCalls += 1;
    const input = path.join(
      root,
      `candidate-${options.scale}-${captureCalls}.rgba`,
    );
    const pixels = options.scale === 1
      ? Buffer.from([40, 50, 60, 255])
      : Buffer.from([
          40, 50, 60, 255,
          40, 50, 60, 255,
          40, 50, 60, 255,
          40, 50, 60, 255,
        ]);
    await writeFile(input, pixels);
    const capture = await captureBackingFixture({
      projectRoot: PROJECT_ROOT,
      inputPath: input,
      inputFormat: 'rgba',
      outputDirectory: options.outputDirectory,
      identity: options.identity,
      stageWidth: options.stageWidth,
      stageHeight: options.stageHeight,
      scale: options.scale,
    });
    const receipt = makeHashBoundDocument(
      'canvas-browser-backing-capture-receipt',
      {
        responseStatus: 200,
        identity: options.identity,
        canvas: {renderScale: options.scale},
        runtimeSignals: {
          consoleErrors: [],
          pageErrors: [],
          failedRequests: [],
          unexpectedOrigins: [],
          forbiddenRequests: [],
          httpErrors: [],
        },
      },
    );
    await writeOrCheckHashBoundReport({
      projectRoot: PROJECT_ROOT,
      outputPath: path.join(
        options.outputDirectory,
        'browser-capture-receipt.json',
      ),
      document: receipt,
    });
    return {...capture, browserReceipt: receipt};
  };
  const placementRunner = async ({projectRoot, placement: item, probe}) => {
    const receipt = makeHashBoundDocument(PLACEMENT_PROBE_ARTIFACT, {
      placement: {
        placementKey: item.placementKey,
        placementId: item.placementId,
        releaseId: item.releaseId,
        ordinal: item.ordinal,
        animationId: item.animationId,
      },
      locale: probe.locale,
      status: 'pass',
      authorityEffects: authorityEffects(),
    });
    await writeOrCheckHashBoundReport({
      projectRoot,
      outputPath: probe.output,
      document: receipt,
    });
    return {document: receipt, outputPath: probe.output};
  };
  const report = await executeCaptureSetPlan({
    projectRoot: PROJECT_ROOT,
    plan,
  }, {captureRunner, placementRunner});
  verifyHashBoundDocument(report, CAPTURE_SET_REPORT_ARTIFACT);
  assert.equal(report.payload.summary.status, 'pass');
  assert.equal(captureCalls, 2);
  const checked = await verifyCompletedCaptureSet({
    projectRoot: PROJECT_ROOT,
    plan,
  });
  assert.equal(checked.contentSha256, report.contentSha256);
  const sheet = plan.payload.renderers[0].contactSheets[0];
  const sheetManifest = JSON.parse(await readFile(
    path.resolve(PROJECT_ROOT, sheet.manifest),
    'utf8',
  ));
  verifyHashBoundDocument(sheetManifest, CONTACT_SHEET_MANIFEST_ARTIFACT);
  assert.equal(sheetManifest.payload.status, 'rendered-unreviewed');
  assert.equal(sheetManifest.payload.visualReviewStatus, 'pending-owner-review');
  const sheetImage = decodePng(
    await readFile(path.resolve(PROJECT_ROOT, sheet.output)),
    'fixture contact sheet',
  );
  assert.equal(sheetImage.width, 1320);
  assert.equal(sheetImage.height, 256);
  assert.equal(report.payload.summary.expectedContactSheetCount, 1);
  assert.equal(report.payload.summary.completedContactSheetCount, 1);
  await rm(sheet.output);
  await assert.rejects(
    () => verifyCompletedCaptureSet({
      projectRoot: PROJECT_ROOT,
      plan,
    }),
    /ENOENT|no such file/u,
  );
});

test('execution refuses an incomplete v1 baseline before invoking any browser runner', async (t) => {
  const root = await temporaryDirectory(t);
  const animationId = 'course-g05-l03-in-001';
  const plan = createCaptureSetPlan({
    projectRoot: PROJECT_ROOT,
    baseUrl: 'https://preview.example.test/',
    baselineRoot: path.relative(PROJECT_ROOT, path.join(root, 'missing-baseline')),
    outputRoot: path.relative(PROJECT_ROOT, path.join(root, 'output')),
    profileBinding: fixtureProfileBinding(root),
    rendererRecords: [rendererRecord(root, animationId)],
    placements: [placement({animationId, ordinal: 1})],
    contract: fixtureContract({
      rendererCount: 1,
      placementCount: 1,
      placementProbeLocales: ['en'],
    }),
  });
  let captureCalls = 0;
  await assert.rejects(
    () => executeCaptureSetPlan({
      projectRoot: PROJECT_ROOT,
      plan,
    }, {
      captureRunner: async () => { captureCalls += 1; },
    }),
    /baseline is incomplete/u,
  );
  assert.equal(captureCalls, 0);
});
