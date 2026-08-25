#!/usr/bin/env node

import {createHash} from 'node:crypto';
import {
  lstat,
  readFile,
} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {
  authorityEffects,
  canonicalJson,
  decodePng,
  encodePng,
  loadCaptureManifest,
  makeHashBoundDocument,
  projectRelative,
  resolveInside,
  sha256,
  validateImage,
  verifyHashBoundDocument,
  writeOrCheckBytes,
  writeOrCheckHashBoundReport,
} from './canvas-backing-image.mjs';
import {
  captureBrowserCanvasBacking,
  classifyCanvasCaptureRequest,
} from './capture-canvas-backing.mjs';
import {compareCanvasScale} from './compare-canvas-scale.mjs';
import {verifyCanvasK1Parity} from './verify-canvas-k1-parity.mjs';
import {
  DEFAULT_V2_PROFILE,
  validateProfileDocument,
} from './verify-current-js-resolution-profile.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const defaultProjectRoot = path.resolve(path.dirname(scriptPath), '..');

export const CAPTURE_SET_PLAN_ARTIFACT =
  'canvas-resolution-production-five-capture-set-plan';
export const CONTACT_SHEET_INDEX_ARTIFACT =
  'canvas-resolution-production-five-contact-sheet-index';
export const CONTACT_SHEET_MANIFEST_ARTIFACT =
  'canvas-resolution-renderer-contact-sheet-manifest';
export const STATE_REPORT_ARTIFACT =
  'canvas-resolution-state-verification-report';
export const RENDERER_REPORT_ARTIFACT =
  'canvas-resolution-renderer-verification-report';
export const PLACEMENT_PROBE_ARTIFACT =
  'canvas-resolution-placement-activation-probe';
export const PLACEMENT_REPORT_ARTIFACT =
  'canvas-resolution-placement-verification-report';
export const CAPTURE_SET_REPORT_ARTIFACT =
  'canvas-resolution-production-five-verification-report';

const MAIN_RELEASE_CATALOG = 'catalog/lesson-releases.json';
const PAGE_ONLY_RELEASE_CATALOG =
  'catalog/page-only-current-js-product-releases.json';
const DEFAULT_BASELINE_ROOT =
  'reports/canvas-resolution/baseline/v1-backing';
const DEFAULT_OUTPUT_ROOT =
  'reports/canvas-resolution/capture-set/production-five';
const PAGE_RENDERER =
  /^courses\/(course-g(?:03|04|05)-l\d{2}-[^/]+)\/canvas-renderer\.js$/u;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const PRODUCTION_COUNTS = Object.freeze({
  public: 929,
  serverAudio: 185,
  total: 1114,
});
const PRODUCTION_CAPTURE_CONTRACT = Object.freeze({
  rendererCount: 283,
  placementCount: 284,
  nativeWidth: 800,
  nativeHeight: 600,
  contactSheetTileLimit: 24,
  placementProbeLocales: Object.freeze(['en', 'es']),
  approvedReleaseIds: Object.freeze([
    'lesson-g03-l02-addition-subtraction-page-only-current-js',
    'lesson-g04-l03-negative-numbers',
    'lesson-g05-l03-exponents-prime-factorizations-page-only',
    'lesson-g05-l04-number-lines',
    'lesson-g05-l05-add-subtract-negative-numbers',
  ]),
});
const CONTACT_SHEET_LAYOUT = Object.freeze({
  schemaVersion: 1,
  algorithm: 'nearest-rgba-over-white-v1',
  tileWidth: 320,
  tileHeight: 240,
  columns: 4,
  padding: 8,
  background: Object.freeze([236, 239, 244, 255]),
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function positiveInteger(value, label) {
  invariant(Number.isSafeInteger(value) && value > 0,
    `${label} must be a positive safe integer`);
  return value;
}

function ordinaryFile(stat, label) {
  invariant(stat.isFile() && !stat.isSymbolicLink(),
    `${label} must be an ordinary file`);
}

function stableHash(value) {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

function portable(value) {
  return value.split(path.sep).join('/');
}

async function readOrdinaryBytes(projectRoot, candidate, label) {
  const resolved = resolveInside(projectRoot, candidate, label);
  const stat = await lstat(resolved);
  ordinaryFile(stat, label);
  const bytes = await readFile(resolved);
  invariant(bytes.length === stat.size, `${label} changed while it was read`);
  return {path: resolved, bytes, sha256: sha256(bytes)};
}

async function readJsonBinding(projectRoot, candidate, label) {
  const binding = await readOrdinaryBytes(projectRoot, candidate, label);
  let document;
  try {
    document = JSON.parse(binding.bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} is invalid JSON: ${error.message}`);
  }
  return {
    ...binding,
    document,
    relativePath: projectRelative(projectRoot, binding.path),
  };
}

function fileDescriptor(projectRoot, binding) {
  return {
    path: projectRelative(projectRoot, binding.path),
    bytes: binding.bytes.length,
    sha256: binding.sha256,
  };
}

function rendererFilePath(projectRoot, entry) {
  invariant(entry.storageRoot === 'public',
    `${entry.assetPath}: renderer must use public storage`);
  return resolveInside(
    projectRoot,
    `apps/web/public/flash-assets/courses/${entry.relativePath}`,
    `${entry.assetPath} renderer`,
  );
}

function findMatchingJsonObject(source, marker, label) {
  const markerIndex = source.indexOf(marker);
  invariant(markerIndex >= 0, `${label} is missing ${marker}`);
  const opening = source.indexOf('{', markerIndex + marker.length);
  invariant(opening >= 0, `${label} metadata object is missing`);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index];
    if (quote !== null) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === '"') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(opening, index + 1);
    }
  }
  throw new Error(`${label} metadata object is unterminated`);
}

export function extractCanvasRuntimeMetadata(bytes, animationId) {
  const source = Buffer.from(bytes).toString('utf8');
  const raw = findMatchingJsonObject(
    source,
    'var METADATA = deepFreeze(',
    animationId,
  );
  let metadata;
  try {
    metadata = JSON.parse(raw);
  } catch (error) {
    throw new Error(`${animationId} METADATA is not strict JSON: ${error.message}`);
  }
  invariant(metadata?.animationId === animationId,
    `${animationId} METADATA identity mismatch`);
  invariant(metadata?.stage?.width === 800 && metadata?.stage?.height === 600,
    `${animationId} METADATA stage must be 800x600`);
  return metadata;
}

function validateRequirement(requirement, label) {
  invariant(requirement && typeof requirement === 'object',
    `${label} must be an object`);
  for (const [key, value] of Object.entries({
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    scenario: requirement.scenario,
  })) {
    invariant(typeof value === 'string' && SAFE_ID.test(value),
      `${label}.${key} is not a stable capture ID`);
  }
  invariant(requirement.language === 'en' || requirement.language === 'es',
    `${label}.language must be en or es`);
  invariant(typeof requirement.seed === 'string' && /^\d+$/u.test(requirement.seed),
    `${label}.seed must be a canonical unsigned integer string`);
  invariant(SHA256.test(requirement.entryStateSha256 || ''),
    `${label}.entryStateSha256 is invalid`);
  const firstFrame = positiveInteger(
    requirement.requiredRange?.firstFrame,
    `${label}.requiredRange.firstFrame`,
  );
  const lastFrame = positiveInteger(
    requirement.requiredRange?.lastFrame,
    `${label}.requiredRange.lastFrame`,
  );
  invariant(lastFrame >= firstFrame,
    `${label}.requiredRange is reversed`);
  const thresholdClass = requirement.resolutionThresholdClass ?? 'static';
  invariant(thresholdClass === 'static' || thresholdClass === 'transition',
    `${label}.resolutionThresholdClass must be static or transition`);
  return {
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
    firstFrame,
    lastFrame,
    thresholdClass,
  };
}

function fallbackRequirements(metadata, animationId) {
  const timeline = metadata.deterministicContentTimeline;
  invariant(timeline && typeof timeline.timelineId === 'string' &&
    SAFE_ID.test(timeline.timelineId),
  `${animationId} has no stable deterministic content timeline`);
  const frameCount = positiveInteger(
    timeline.frameCount,
    `${animationId} deterministic frameCount`,
  );
  invariant(Array.isArray(metadata.scenarios) && metadata.scenarios.length > 0,
    `${animationId} scenarios are missing`);
  invariant(Array.isArray(metadata.supportedLanguages) &&
    metadata.supportedLanguages.length > 0,
  `${animationId} supportedLanguages are missing`);
  const requirements = [];
  for (const scenario of metadata.scenarios) {
    invariant(typeof scenario === 'string' && SAFE_ID.test(scenario),
      `${animationId} scenario is invalid`);
    for (const language of metadata.supportedLanguages) {
      invariant(language === 'en' || language === 'es',
        `${animationId} language is invalid`);
      const entryState = {
        kind: 'adaptive-resolution-source-static-entry-v1',
        animationId,
        frameDomainId: timeline.timelineId,
        scenario,
        language,
        seed: '0',
      };
      requirements.push({
        requirementId:
          `resolution-${timeline.timelineId}-${scenario}-${language}`,
        frameDomainId: timeline.timelineId,
        traceId:
          `resolution-${timeline.timelineId}-${scenario}-${language}-seed-0`,
        entryStateSha256: stableHash(entryState),
        scenario,
        language,
        seed: '0',
        firstFrame: 1,
        lastFrame: frameCount,
        thresholdClass: 'static',
      });
    }
  }
  return requirements;
}

async function resolveRendererRequirements({
  projectRoot,
  animationId,
  rendererBinding,
}) {
  const coverageRelative =
    `migrations/${animationId}/evidence/full-frame-coverage.json`;
  const coveragePath = resolveInside(projectRoot, coverageRelative, 'coverage-v2');
  let coverageStat = null;
  try {
    coverageStat = await lstat(coveragePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (coverageStat !== null) {
    ordinaryFile(coverageStat, `${animationId} coverage-v2`);
    const coverage = await readJsonBinding(
      projectRoot,
      coverageRelative,
      `${animationId} coverage-v2`,
    );
    invariant(coverage.document.schemaVersion === 2 &&
      coverage.document.animationId === animationId &&
      Array.isArray(coverage.document.requirements) &&
      coverage.document.requirements.length > 0,
    `${animationId} coverage-v2 identity or requirements are invalid`);
    const requirements = coverage.document.requirements.map(
      (requirement, index) => validateRequirement(
        requirement,
        `${animationId}.requirements[${index}]`,
      ),
    );
    invariant(new Set(requirements.map(({requirementId}) => requirementId)).size ===
      requirements.length,
    `${animationId} coverage-v2 requirement IDs are duplicated`);
    return {
      source: {
        kind: 'coverage-v2',
        ...fileDescriptor(projectRoot, coverage),
      },
      requirements,
    };
  }
  const metadata = extractCanvasRuntimeMetadata(
    rendererBinding.bytes,
    animationId,
  );
  return {
    source: {
      kind: 'renderer-metadata-fallback',
      path: projectRelative(projectRoot, rendererBinding.path),
      bytes: rendererBinding.bytes.length,
      sha256: rendererBinding.sha256,
      metadataSha256: stableHash(metadata),
    },
    requirements: fallbackRequirements(metadata, animationId),
  };
}

function releaseDocuments(documents) {
  const releases = [];
  for (const document of documents) {
    invariant(document && Array.isArray(document.releases),
      'release catalog must contain releases[]');
    releases.push(...document.releases);
  }
  return releases;
}

export function resolveProductionPlacements({
  releaseCatalogDocuments,
  approvedReleaseIds = PRODUCTION_CAPTURE_CONTRACT.approvedReleaseIds,
}) {
  const allReleases = releaseDocuments(releaseCatalogDocuments);
  const placements = [];
  for (const releaseId of approvedReleaseIds) {
    const matches = allReleases.filter((release) => release.releaseId === releaseId);
    invariant(matches.length === 1,
      `${releaseId} must appear in exactly one release catalog`);
    const release = matches[0];
    const members = release.members.filter(
      (member) => member.releaseRole === 'active-xml-referenced-page',
    );
    invariant(members.length === release.expectedCounts.activeXmlReferencedPages,
      `${releaseId} active page count changed`);
    members.forEach((member, index) => {
      const ordinal = index + 1;
      invariant(member.ordinal === ordinal && member.xmlOccurrence === ordinal,
        `${releaseId} source order drifted at ${ordinal}`);
      invariant(typeof member.animationId === 'string' &&
        /^course-g(?:03|04|05)-l\d{2}-/u.test(member.animationId),
      `${releaseId} member ${ordinal} animationId is invalid`);
      const declaredPlacementId = member.placementId ?? null;
      invariant(declaredPlacementId === null ||
        (typeof declaredPlacementId === 'string' &&
          /^[A-Za-z0-9._-]+$/u.test(declaredPlacementId)),
      `${releaseId} member ${ordinal} placementId is invalid`);
      placements.push({
        placementKey: declaredPlacementId ??
          `${releaseId}-ordinal-${String(ordinal).padStart(3, '0')}`,
        placementId: declaredPlacementId,
        releaseId,
        grade: release.grade,
        lesson: release.lesson,
        ordinal,
        animationId: member.animationId,
        xmlOccurrence: member.xmlOccurrence,
        source: member.source,
      });
    });
  }
  invariant(new Set(placements.map(({placementKey}) => placementKey)).size ===
    placements.length,
  'placement keys are duplicated');
  return placements;
}

function captureUrl(baseUrl, animationId, identity) {
  const prefix = identity.language === 'es' ? '/es' : '';
  const url = new URL(`${prefix}/animations/${animationId}`, baseUrl);
  url.searchParams.set('capture', '1');
  url.searchParams.set('frame', String(identity.frame));
  url.searchParams.set('frameDomain', identity.frameDomainId);
  url.searchParams.set('requirementId', identity.requirementId);
  url.searchParams.set('trace', identity.traceId);
  url.searchParams.set('entryStateSha256', identity.entryStateSha256);
  url.searchParams.set('scenario', identity.scenario);
  url.searchParams.set('lang', identity.language);
  url.searchParams.set('seed', identity.seed);
  return url.href;
}

function statePlan({
  projectRoot,
  baseUrl,
  baselineRoot,
  outputRoot,
  animationId,
  requirement,
  frame,
}) {
  const identity = {
    animationId,
    requirementId: requirement.requirementId,
    frameDomainId: requirement.frameDomainId,
    traceId: requirement.traceId,
    entryStateSha256: requirement.entryStateSha256,
    frame,
    scenario: requirement.scenario,
    language: requirement.language,
    seed: requirement.seed,
  };
  const stateIdentitySha256 = stableHash(identity);
  const stateId = `state-${stateIdentitySha256.slice(0, 20)}-f${String(frame).padStart(6, '0')}`;
  const base = `${outputRoot}/renderers/${animationId}/states/${stateId}`;
  return {
    stateId,
    stateIdentitySha256,
    identity,
    thresholdClass: requirement.thresholdClass,
    captureUrl: captureUrl(baseUrl, animationId, identity),
    baselineManifest:
      `${baselineRoot}/${animationId}/${stateId}/capture-manifest.json`,
    candidateK1: {
      outputDirectory: `${base}/candidate-k1`,
      manifest: `${base}/candidate-k1/capture-manifest.json`,
      browserReceipt: `${base}/candidate-k1/browser-capture-receipt.json`,
    },
    candidateK2: {
      outputDirectory: `${base}/candidate-k2`,
      manifest: `${base}/candidate-k2/capture-manifest.json`,
      browserReceipt: `${base}/candidate-k2/browser-capture-receipt.json`,
    },
    k1ParityReport: `${base}/k1-parity.json`,
    scaleComparisonReport: `${base}/k2-scale-comparison.json`,
    stateReport: `${base}/state-report.json`,
  };
}

function contactSheetsFor(renderer, outputRoot, tileLimit) {
  const sheets = [];
  for (let offset = 0; offset < renderer.states.length; offset += tileLimit) {
    const tiles = renderer.states.slice(offset, offset + tileLimit).map((state) => ({
      stateId: state.stateId,
      identity: state.identity,
      image: `${state.candidateK2.outputDirectory}/backing.png`,
      comparisonReport: state.scaleComparisonReport,
      k1ParityReport: state.k1ParityReport,
    }));
    const sheet = sheets.length + 1;
    sheets.push({
      sheet,
      tileCount: tiles.length,
      output:
        `${outputRoot}/contact-sheets/${renderer.animationId}/sheet-${String(sheet).padStart(4, '0')}.png`,
      manifest:
        `${outputRoot}/contact-sheets/${renderer.animationId}/sheet-${String(sheet).padStart(4, '0')}.json`,
      status: 'pending-human-render-and-review',
      tiles,
    });
  }
  return sheets;
}

function compositeOverWhite(channel, alpha) {
  return Math.floor((channel * alpha + 255 * (255 - alpha) + 127) / 255);
}

export function composeContactSheetImage(
  images,
  layout = CONTACT_SHEET_LAYOUT,
) {
  invariant(Array.isArray(images) && images.length > 0,
    'contact sheet requires at least one image');
  for (const [index, image] of images.entries()) {
    validateImage(image, `contact sheet image ${index}`);
  }
  const {tileWidth, tileHeight, columns, padding, background} = layout;
  for (const [label, value] of Object.entries({
    tileWidth,
    tileHeight,
    columns,
    padding,
  })) {
    invariant(Number.isSafeInteger(value) &&
      (label === 'padding' ? value >= 0 : value > 0),
    `contact sheet ${label} is invalid`);
  }
  invariant(Array.isArray(background) && background.length === 4 &&
    background.every((value) => Number.isInteger(value) &&
      value >= 0 && value <= 255),
  'contact sheet background is invalid');
  const rows = Math.ceil(images.length / columns);
  const width = padding + columns * (tileWidth + padding);
  const height = padding + rows * (tileHeight + padding);
  const data = Buffer.alloc(width * height * 4);
  for (let offset = 0; offset < data.length; offset += 4) {
    data[offset] = background[0];
    data[offset + 1] = background[1];
    data[offset + 2] = background[2];
    data[offset + 3] = background[3];
  }
  const placements = [];
  images.forEach((image, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + column * (tileWidth + padding);
    const y = padding + row * (tileHeight + padding);
    for (let tileY = 0; tileY < tileHeight; tileY += 1) {
      const sourceY = Math.min(
        image.height - 1,
        Math.floor((tileY + 0.5) * image.height / tileHeight),
      );
      for (let tileX = 0; tileX < tileWidth; tileX += 1) {
        const sourceX = Math.min(
          image.width - 1,
          Math.floor((tileX + 0.5) * image.width / tileWidth),
        );
        const sourceOffset = (sourceY * image.width + sourceX) * 4;
        const destinationOffset = (
          (y + tileY) * width + x + tileX
        ) * 4;
        const alpha = image.data[sourceOffset + 3];
        data[destinationOffset] = compositeOverWhite(
          image.data[sourceOffset],
          alpha,
        );
        data[destinationOffset + 1] = compositeOverWhite(
          image.data[sourceOffset + 1],
          alpha,
        );
        data[destinationOffset + 2] = compositeOverWhite(
          image.data[sourceOffset + 2],
          alpha,
        );
        data[destinationOffset + 3] = 255;
      }
    }
    placements.push({index, row, column, x, y, width: tileWidth, height: tileHeight});
  });
  return {
    image: validateImage({width, height, data}, 'contact sheet'),
    placements,
    layout,
  };
}

async function renderContactSheet({projectRoot, renderer, sheet}) {
  const tileBindings = [];
  const images = [];
  for (const tile of sheet.tiles) {
    const [imageBinding, parity, comparison] = await Promise.all([
      readOrdinaryBytes(projectRoot, tile.image, `${tile.stateId} k2 PNG`),
      bindHashBoundReport(
        projectRoot,
        tile.k1ParityReport,
        'canvas-k1-parity-report',
      ),
      bindHashBoundReport(
        projectRoot,
        tile.comparisonReport,
        'canvas-scale-comparison-report',
      ),
    ]);
    invariant(parity.document.payload.status === 'pass' &&
      comparison.document.payload.status === 'pass',
    `${tile.stateId} cannot enter a contact sheet before parity/fidelity pass`);
    images.push(decodePng(imageBinding.bytes, `${tile.stateId} k2 PNG`));
    tileBindings.push({
      stateId: tile.stateId,
      identity: tile.identity,
      image: fileDescriptor(projectRoot, imageBinding),
      k1Parity: publicReportBinding(parity),
      k2ScaleComparison: publicReportBinding(comparison),
    });
  }
  const composed = composeContactSheetImage(images);
  const pngBytes = encodePng(composed.image);
  await writeOrCheckBytes({
    projectRoot,
    destination: sheet.output,
    bytes: pngBytes,
    label: `${renderer.animationId} contact sheet PNG`,
  });
  const output = await readOrdinaryBytes(
    projectRoot,
    sheet.output,
    `${renderer.animationId} contact sheet PNG`,
  );
  const document = makeHashBoundDocument(CONTACT_SHEET_MANIFEST_ARTIFACT, {
    evidenceClass: 'adaptive-resolution-owner-contact-sheet-candidate',
    animationId: renderer.animationId,
    releaseId: renderer.releaseId,
    sheet: sheet.sheet,
    layout: composed.layout,
    placements: composed.placements,
    tiles: tileBindings,
    output: {
      ...fileDescriptor(projectRoot, output),
      width: composed.image.width,
      height: composed.image.height,
    },
    visualReviewStatus: 'pending-owner-review',
    status: 'rendered-unreviewed',
    authorityEffects: authorityEffects(),
  });
  await writeOrCheckHashBoundReport({
    projectRoot,
    outputPath: sheet.manifest,
    document,
  });
  return bindHashBoundReport(
    projectRoot,
    sheet.manifest,
    CONTACT_SHEET_MANIFEST_ARTIFACT,
  );
}

async function verifyContactSheet({projectRoot, renderer, sheet}) {
  const manifest = await bindHashBoundReport(
    projectRoot,
    sheet.manifest,
    CONTACT_SHEET_MANIFEST_ARTIFACT,
  );
  const payload = manifest.document.payload;
  invariant(payload.animationId === renderer.animationId &&
    payload.releaseId === renderer.releaseId &&
    payload.sheet === sheet.sheet &&
    payload.status === 'rendered-unreviewed' &&
    payload.visualReviewStatus === 'pending-owner-review' &&
    payload.tiles.length === sheet.tiles.length &&
    canonicalJson(payload.layout) === canonicalJson(CONTACT_SHEET_LAYOUT),
  `${renderer.animationId} contact sheet manifest identity changed`);
  const output = await readOrdinaryBytes(
    projectRoot,
    sheet.output,
    `${renderer.animationId} contact sheet PNG`,
  );
  invariant(canonicalJson(payload.output) === canonicalJson({
    ...fileDescriptor(projectRoot, output),
    width: payload.output.width,
    height: payload.output.height,
  }), `${renderer.animationId} contact sheet PNG changed`);
  const decoded = decodePng(
    output.bytes,
    `${renderer.animationId} contact sheet PNG`,
  );
  invariant(decoded.width === payload.output.width &&
    decoded.height === payload.output.height,
  `${renderer.animationId} contact sheet dimensions changed`);
  const images = [];
  for (let index = 0; index < sheet.tiles.length; index += 1) {
    const planned = sheet.tiles[index];
    const recorded = payload.tiles[index];
    const [image, parity, comparison] = await Promise.all([
      readOrdinaryBytes(
        projectRoot,
        planned.image,
        `${planned.stateId} k2 PNG`,
      ),
      bindHashBoundReport(
        projectRoot,
        planned.k1ParityReport,
        'canvas-k1-parity-report',
      ),
      bindHashBoundReport(
        projectRoot,
        planned.comparisonReport,
        'canvas-scale-comparison-report',
      ),
    ]);
    invariant(recorded.stateId === planned.stateId &&
      sameIdentity(recorded.identity, planned.identity) &&
      canonicalJson(recorded.image) ===
        canonicalJson(fileDescriptor(projectRoot, image)) &&
      canonicalJson(recorded.k1Parity) ===
        canonicalJson(publicReportBinding(parity)) &&
      canonicalJson(recorded.k2ScaleComparison) ===
        canonicalJson(publicReportBinding(comparison)) &&
      parity.document.payload.status === 'pass' &&
      comparison.document.payload.status === 'pass',
    `${planned.stateId} contact sheet tile changed`);
    images.push(decodePng(image.bytes, `${planned.stateId} k2 PNG`));
  }
  const recomposed = composeContactSheetImage(images, payload.layout);
  invariant(canonicalJson(payload.placements) ===
    canonicalJson(recomposed.placements),
  `${renderer.animationId} contact sheet placements changed`);
  const expectedOutput = encodePng(recomposed.image);
  invariant(expectedOutput.equals(output.bytes),
    `${renderer.animationId} contact sheet pixels are not deterministic`);
  return manifest;
}

function lessonRoute(placement, locale, baseUrl) {
  const prefix = locale === 'es' ? '/es' : '';
  return new URL(
    `${prefix}/courses/${placement.grade}/${placement.lesson}?mode=focus`,
    baseUrl,
  ).href;
}

/**
 * Pure plan builder used by the file-backed production loader and fixtures.
 */
export function createCaptureSetPlan({
  projectRoot,
  baseUrl,
  baselineRoot,
  outputRoot,
  profileBinding,
  rendererRecords,
  placements,
  contract = PRODUCTION_CAPTURE_CONTRACT,
  releaseCatalogBindings = [],
}) {
  invariant(rendererRecords.length === contract.rendererCount,
    `renderer count is ${rendererRecords.length}, expected ${contract.rendererCount}`);
  invariant(placements.length === contract.placementCount,
    `placement count is ${placements.length}, expected ${contract.placementCount}`);
  invariant(new Set(placements.map(({placementKey}) => placementKey)).size ===
    placements.length,
  'placement keys are duplicated');
  invariant(new Set(rendererRecords.map(({animationId}) => animationId)).size ===
    rendererRecords.length,
  'renderer identities are duplicated');
  const rendererIds = new Set(rendererRecords.map(({animationId}) => animationId));
  invariant(placements.every(({animationId}) => rendererIds.has(animationId)),
    'a placement has no profile-bound renderer');
  invariant(new Set(placements.map(({animationId}) => animationId)).size ===
    rendererRecords.length,
  'profile renderer set does not equal placement renderer set');

  if (contract.rendererCount === 283 && contract.placementCount === 284) {
    const repeated = placements.filter(
      ({animationId}) => animationId === 'course-g05-l03-in-028',
    );
    invariant(repeated.length === 2 &&
      repeated[0].ordinal === 45 && repeated[1].ordinal === 46 &&
      repeated[0].placementId === 'g05-l03-placement-045' &&
      repeated[1].placementId === 'g05-l03-placement-046',
    'G5 L3 IN028 placement identities 045/046 changed');
  }

  let requirementCount = 0;
  let stateCount = 0;
  const renderers = rendererRecords.map((record) => {
    invariant(record.requirements.length > 0,
      `${record.animationId} has no capture requirements`);
    requirementCount += record.requirements.length;
    const states = [];
    for (const requirement of record.requirements) {
      for (let frame = requirement.firstFrame;
        frame <= requirement.lastFrame; frame += 1) {
        states.push(statePlan({
          projectRoot,
          baseUrl,
          baselineRoot,
          outputRoot,
          animationId: record.animationId,
          requirement,
          frame,
        }));
      }
    }
    invariant(new Set(states.map(({stateIdentitySha256}) =>
      stateIdentitySha256)).size === states.length,
    `${record.animationId} expanded duplicate capture states`);
    stateCount += states.length;
    const renderer = {
      animationId: record.animationId,
      releaseId: record.releaseId,
      profileEntry: record.profileEntry,
      rendererFile: record.rendererFile,
      requirementSource: record.requirementSource,
      requirementCount: record.requirements.length,
      stateCount: states.length,
      states,
      rendererReport:
        `${outputRoot}/renderers/${record.animationId}/renderer-report.json`,
    };
    return {
      ...renderer,
      contactSheets: contactSheetsFor(
        renderer,
        outputRoot,
        contract.contactSheetTileLimit,
      ),
    };
  });
  const rendererById = new Map(renderers.map((renderer) => [
    renderer.animationId,
    renderer,
  ]));
  const placementPlans = placements.map((placement) => {
    const safePlacement = placement.placementKey.replace(/:/gu, '-');
    const probes = contract.placementProbeLocales.map((locale) => ({
      locale,
      url: lessonRoute(placement, locale, baseUrl),
      output:
        `${outputRoot}/placements/${safePlacement}/probe-${locale}.json`,
    }));
    return {
      ...placement,
      rendererReport: rendererById.get(placement.animationId).rendererReport,
      probes,
      placementReport:
        `${outputRoot}/placements/${safePlacement}/placement-report.json`,
    };
  });
  const profile = {
    path: projectRelative(projectRoot, profileBinding.path),
    bytes: profileBinding.bytes.length,
    sha256: profileBinding.sha256,
    profileId: profileBinding.document.profileId,
    checksumSetSha256: profileBinding.document.checksumSetSha256,
  };
  return makeHashBoundDocument(CAPTURE_SET_PLAN_ARTIFACT, {
    evidenceClass:
      'production-five-current-javascript-adaptive-resolution-capture-set',
    contract: {
      rendererCount: contract.rendererCount,
      placementCount: contract.placementCount,
      nativeWidth: contract.nativeWidth,
      nativeHeight: contract.nativeHeight,
      renderScales: [1, 2],
      k1Parity: 'rgba-and-png-byte-exact',
      k2Comparison: 'native-backing-premultiplied-srgb-box-downsample',
      placementProbeLocales: [...contract.placementProbeLocales],
      failClosedSignals: [
        'missing-baseline-or-candidate-capture',
        'capture-identity-mismatch',
        'main-or-subresource-http-status-greater-than-or-equal-to-400',
        'cross-origin-request',
        'same-origin-candidate-private-swf-fla-or-ruffle-request',
        'console-or-page-error',
        'k1-parity-failure',
        'k2-rmse-failure',
        'placement-activation-mismatch',
      ],
    },
    inputs: {
      profile,
      releaseCatalogs: releaseCatalogBindings,
      baseUrl,
      baselineRoot,
      outputRoot,
    },
    summary: {
      rendererCount: renderers.length,
      placementCount: placementPlans.length,
      requirementCount,
      stateCount,
      candidateBackingCaptureCount: stateCount * 2,
      k1ParityComparisonCount: stateCount,
      k2ScaleComparisonCount: stateCount,
      placementProbeCount:
        placementPlans.length * contract.placementProbeLocales.length,
      repeatedRendererPlacementCount:
        placementPlans.length - renderers.length,
    },
    renderers,
    placements: placementPlans,
    outputs: {
      contactSheetIndex: `${outputRoot}/contact-sheet-index.json`,
      aggregateReport: `${outputRoot}/capture-set-report.json`,
    },
    authorityEffects: authorityEffects(),
  });
}

export async function buildFileBackedCaptureSetPlan({
  projectRoot = defaultProjectRoot,
  profilePath = DEFAULT_V2_PROFILE,
  releaseCatalogPaths = [MAIN_RELEASE_CATALOG, PAGE_ONLY_RELEASE_CATALOG],
  baseUrl,
  baselineRoot = DEFAULT_BASELINE_ROOT,
  outputRoot = DEFAULT_OUTPUT_ROOT,
  contract = PRODUCTION_CAPTURE_CONTRACT,
  expectedProfileCounts = PRODUCTION_COUNTS,
}) {
  const root = path.resolve(projectRoot);
  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new Error('--base-url must be an absolute HTTP(S) URL');
  }
  invariant(parsedBase.protocol === 'http:' || parsedBase.protocol === 'https:',
    '--base-url must be an absolute HTTP(S) URL');
  const baseUrlNormalized = `${parsedBase.origin}/`;
  resolveInside(root, baselineRoot, 'baseline root');
  resolveInside(root, outputRoot, 'output root');
  const profileBinding = await readJsonBinding(root, profilePath, 'v2 profile');
  validateProfileDocument(profileBinding.document, {
    version: 2,
    expectedCounts: expectedProfileCounts,
  });
  const releaseCatalogBindings = await Promise.all(releaseCatalogPaths.map(
    (catalogPath, index) => readJsonBinding(
      root,
      catalogPath,
      `release catalog ${index + 1}`,
    ),
  ));
  const placements = resolveProductionPlacements({
    releaseCatalogDocuments: releaseCatalogBindings.map(({document}) => document),
    approvedReleaseIds: contract.approvedReleaseIds,
  });
  const rendererEntries = profileBinding.document.entries
    .map((entry) => ({entry, match: PAGE_RENDERER.exec(entry.assetPath)}))
    .filter(({match}) => match !== null)
    .map(({entry, match}) => ({entry, animationId: match[1]}))
    .sort((left, right) => left.animationId.localeCompare(right.animationId, 'en'));
  invariant(rendererEntries.length === contract.rendererCount,
    `v2 profile renderer count is ${rendererEntries.length}`);
  const rendererRecords = [];
  for (const {entry, animationId} of rendererEntries) {
    const rendererPath = rendererFilePath(root, entry);
    const rendererBinding = await readOrdinaryBytes(
      root,
      rendererPath,
      `${animationId} renderer`,
    );
    invariant(rendererBinding.bytes.length === entry.bytes &&
      rendererBinding.sha256 === entry.sha256,
    `${animationId} renderer does not match the active v2 profile`);
    const requirementResolution = await resolveRendererRequirements({
      projectRoot: root,
      animationId,
      rendererBinding,
    });
    rendererRecords.push({
      animationId,
      releaseId: entry.releaseId,
      profileEntry: {...entry},
      rendererFile: fileDescriptor(root, rendererBinding),
      requirementSource: requirementResolution.source,
      requirements: requirementResolution.requirements,
    });
  }
  return createCaptureSetPlan({
    projectRoot: root,
    baseUrl: baseUrlNormalized,
    baselineRoot: portable(baselineRoot),
    outputRoot: portable(outputRoot),
    profileBinding,
    rendererRecords,
    placements,
    contract,
    releaseCatalogBindings: releaseCatalogBindings.map((binding) =>
      fileDescriptor(root, binding)),
  });
}

export function buildContactSheetIndex(plan) {
  verifyHashBoundDocument(plan, CAPTURE_SET_PLAN_ARTIFACT);
  return makeHashBoundDocument(CONTACT_SHEET_INDEX_ARTIFACT, {
    evidenceClass: 'canvas-resolution-owner-contact-sheet-work-queue',
    captureSetPlan: {
      contentSha256: plan.contentSha256,
      profileSha256: plan.payload.inputs.profile.sha256,
    },
    summary: {
      rendererCount: plan.payload.summary.rendererCount,
      placementCount: plan.payload.summary.placementCount,
      stateCount: plan.payload.summary.stateCount,
      sheetCount: plan.payload.renderers.reduce(
        (sum, renderer) => sum + renderer.contactSheets.length,
        0,
      ),
      reviewStatus: 'pending-owner-visual-review',
    },
    renderers: plan.payload.renderers.map((renderer) => ({
      animationId: renderer.animationId,
      releaseId: renderer.releaseId,
      placementKeys: plan.payload.placements
        .filter(({animationId}) => animationId === renderer.animationId)
        .map(({placementKey}) => placementKey),
      stateCount: renderer.stateCount,
      sheets: renderer.contactSheets,
    })),
    authorityEffects: authorityEffects(),
  });
}

async function writePlanArtifacts({projectRoot, plan, check}) {
  const outputRoot = plan.payload.inputs.outputRoot;
  const planPath = `${outputRoot}/capture-set-plan.json`;
  const index = buildContactSheetIndex(plan);
  await writeOrCheckHashBoundReport({
    projectRoot,
    outputPath: planPath,
    document: plan,
    check,
  });
  await writeOrCheckHashBoundReport({
    projectRoot,
    outputPath: plan.payload.outputs.contactSheetIndex,
    document: index,
    check,
  });
  return {planPath, index};
}

function sameIdentity(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

async function bindHashBoundReport(projectRoot, reportPath, artifactType) {
  const binding = await readJsonBinding(projectRoot, reportPath, artifactType);
  verifyHashBoundDocument(binding.document, artifactType);
  return {
    path: binding.relativePath,
    bytes: binding.bytes.length,
    sha256: binding.sha256,
    contentSha256: binding.document.contentSha256,
    document: binding.document,
  };
}

function publicReportBinding(binding) {
  return {
    path: binding.path,
    bytes: binding.bytes,
    sha256: binding.sha256,
    contentSha256: binding.contentSha256,
  };
}

function captureManifestBinding(projectRoot, capture) {
  return {
    path: projectRelative(projectRoot, capture.path),
    sha256: capture.sha256,
    contentSha256: capture.document.contentSha256,
  };
}

async function preflightBaselines(projectRoot, plan) {
  const missing = [];
  for (const renderer of plan.payload.renderers) {
    for (const state of renderer.states) {
      const candidate = resolveInside(
        projectRoot,
        state.baselineManifest,
        'baseline manifest',
      );
      try {
        ordinaryFile(await lstat(candidate), state.baselineManifest);
      } catch (error) {
        if (error?.code === 'ENOENT') missing.push(state.baselineManifest);
        else throw error;
      }
    }
  }
  invariant(missing.length === 0,
    `capture-set baseline is incomplete (${missing.length} missing):\n${missing.slice(0, 50).join('\n')}`);
}

function cleanNetworkSignals(signals) {
  return Object.values(signals).every(
    (value) => Array.isArray(value) && value.length === 0,
  );
}

export async function probePlacementActivation({
  projectRoot,
  placement,
  probe,
  browserName = 'chromium',
  check = false,
}, {playwrightModule} = {}) {
  invariant(!check,
    'placement browser probes are never rerun in --check mode');
  const playwright = playwrightModule ?? await import('playwright');
  const browserType = playwright[browserName];
  invariant(browserType && typeof browserType.launch === 'function',
    `Playwright browser is unavailable: ${browserName}`);
  const browser = await browserType.launch({headless: true});
  let context;
  try {
    context = await browser.newContext({
      deviceScaleFactor: 2,
      reducedMotion: 'no-preference',
      serviceWorkers: 'block',
      viewport: {width: 1440, height: 900},
    });
    const page = await context.newPage();
    const signals = {
      consoleErrors: [],
      pageErrors: [],
      failedRequests: [],
      forbiddenRequests: [],
      httpErrors: [],
    };
    const origin = new URL(probe.url).origin;
    page.on('console', (message) => {
      if (message.type() === 'error') signals.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => signals.pageErrors.push(error.message));
    page.on('requestfailed', (request) => signals.failedRequests.push(
      `${request.url()} :: ${request.failure()?.errorText ?? 'unknown'}`,
    ));
    page.on('request', (request) => {
      const classification = classifyCanvasCaptureRequest(request.url(), origin);
      if (!classification.allowed) signals.forbiddenRequests.push(
        `${classification.reason} :: ${request.url()}`,
      );
    });
    page.on('response', (response) => {
      if (response.status() >= 400 && /^https?:/u.test(response.url())) {
        signals.httpErrors.push(`${response.status()} :: ${response.url()}`);
      }
    });
    await page.route('**/api/learning-events', async (route) => {
      await route.fulfill({status: 204});
    });
    const response = await page.goto(probe.url, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    invariant(response && response.status() >= 200 && response.status() < 300,
      `placement ${placement.placementKey} returned HTTP ${response?.status() ?? 'none'}`);
    const player = page.locator('[data-lesson-player]').first();
    await player.waitFor({state: 'visible', timeout: 30_000});
    await page.waitForFunction(() =>
      document.querySelector('[data-lesson-player]')?.getAttribute('data-hydrated') === 'true',
    null, {timeout: 30_000});
    await page.evaluate(({placementId, animationId}) => {
      const buttons = [...document.querySelectorAll('button')];
      const target = placementId
        ? buttons.find((button) => button.dataset.placementId === placementId)
        : buttons.find((button) => button.dataset.animationId === animationId);
      if (!(target instanceof HTMLButtonElement)) {
        throw new Error('placement navigation target is missing');
      }
      target.click();
    }, {
      placementId: placement.placementId,
      animationId: placement.animationId,
    });
    await page.waitForFunction(({placementId, animationId, ordinal}) => {
      const active = document.querySelector('[data-lesson-player]');
      return active?.getAttribute('data-current-animation-id') === animationId &&
        active?.getAttribute('data-current-page') === String(ordinal) &&
        (placementId === null ||
          active?.getAttribute('data-current-placement-id') === placementId);
    }, {
      placementId: placement.placementId,
      animationId: placement.animationId,
      ordinal: placement.ordinal,
    }, {timeout: 30_000});
    const canvas = page.locator(
      `[data-lesson-player] canvas[data-course-canvas="${placement.animationId}"]`,
    );
    await canvas.waitFor({state: 'visible', timeout: 30_000});
    await page.waitForFunction((animationId) => {
      const canvas = document.querySelector(
        `[data-lesson-player] canvas[data-course-canvas="${animationId}"]`,
      );
      return canvas?.getAttribute('data-render-state') === 'ready' &&
        canvas?.getAttribute('data-capture-stage') === 'true';
    }, placement.animationId, {timeout: 30_000});
    const snapshot = await canvas.evaluate((node) => {
      const canvasNode = node;
      const playerNode = canvasNode.closest('[data-lesson-player]');
      const visibleCanvases = [...playerNode.querySelectorAll('canvas')]
        .filter((candidate) => {
          const rect = candidate.getBoundingClientRect();
          const style = getComputedStyle(candidate);
          return candidate.isConnected && rect.width > 0 && rect.height > 0 &&
            style.display !== 'none' && style.visibility !== 'hidden';
        });
      return {
        placementId: playerNode.dataset.currentPlacementId ?? null,
        ordinal: Number(playerNode.dataset.currentPage),
        animationId: playerNode.dataset.currentAnimationId,
        canvasAnimationId: canvasNode.dataset.courseCanvas,
        renderScale: Number(canvasNode.dataset.renderScale),
        backingWidth: canvasNode.width,
        backingHeight: canvasNode.height,
        visibleCanvasCount: visibleCanvases.length,
        runtimeIdentity: {
          frame: canvasNode.dataset.flashFrame,
          frameDomainId: canvasNode.dataset.flashFrameDomain,
          scenario: canvasNode.dataset.flashScenario ??
            canvasNode.dataset.runtimeScenario,
          language: canvasNode.dataset.flashLang ??
            canvasNode.dataset.runtimeLanguage,
          seed: canvasNode.dataset.flashSeed ?? canvasNode.dataset.runtimeSeed,
        },
      };
    });
    invariant(snapshot.animationId === placement.animationId &&
      snapshot.canvasAnimationId === placement.animationId &&
      snapshot.ordinal === placement.ordinal &&
      (placement.placementId === null ||
        snapshot.placementId === placement.placementId),
    `placement ${placement.placementKey} activation identity mismatch`);
    invariant(snapshot.visibleCanvasCount === 1 &&
      snapshot.renderScale === 2 && snapshot.backingWidth === 1600 &&
      snapshot.backingHeight === 1200,
    `placement ${placement.placementKey} Canvas density/visibility mismatch`);
    invariant(cleanNetworkSignals(signals),
      `placement ${placement.placementKey} runtime/network failure: ${JSON.stringify(signals)}`);
    const receipt = makeHashBoundDocument(PLACEMENT_PROBE_ARTIFACT, {
      evidenceClass: 'my-lesson-source-order-placement-activation',
      placement: {
        placementKey: placement.placementKey,
        placementId: placement.placementId,
        releaseId: placement.releaseId,
        ordinal: placement.ordinal,
        animationId: placement.animationId,
      },
      locale: probe.locale,
      url: probe.url,
      responseStatus: response.status(),
      browser: {
        name: browserName,
        version: typeof browser.version === 'function'
          ? browser.version()
          : 'unknown',
      },
      snapshot,
      runtimeSignals: signals,
      status: 'pass',
      authorityEffects: authorityEffects(),
    });
    await writeOrCheckHashBoundReport({
      projectRoot,
      outputPath: probe.output,
      document: receipt,
      check: false,
    });
    return {document: receipt, outputPath: probe.output};
  } finally {
    await context?.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

async function stateVerificationReport({
  projectRoot,
  state,
  parity,
  comparison,
}) {
  invariant(parity.status === 'pass', `${state.stateId} k1 parity failed`);
  invariant(comparison.status === 'pass', `${state.stateId} k2 comparison failed`);
  const [
    baseline,
    candidateK1,
    candidateK2,
    candidateK1Browser,
    candidateK2Browser,
    parityBinding,
    comparisonBinding,
  ] =
    await Promise.all([
      loadCaptureManifest({
        projectRoot,
        manifestPath: state.baselineManifest,
      }),
      loadCaptureManifest({
        projectRoot,
        manifestPath: state.candidateK1.manifest,
      }),
      loadCaptureManifest({
        projectRoot,
        manifestPath: state.candidateK2.manifest,
      }),
      bindHashBoundReport(
        projectRoot,
        state.candidateK1.browserReceipt,
        'canvas-browser-backing-capture-receipt',
      ),
      bindHashBoundReport(
        projectRoot,
        state.candidateK2.browserReceipt,
        'canvas-browser-backing-capture-receipt',
      ),
      bindHashBoundReport(
        projectRoot,
        state.k1ParityReport,
        'canvas-k1-parity-report',
      ),
      bindHashBoundReport(
        projectRoot,
        state.scaleComparisonReport,
        'canvas-scale-comparison-report',
      ),
    ]);
  for (const capture of [baseline, candidateK1, candidateK2]) {
    invariant(sameIdentity(capture.payload.identity, state.identity),
      `${state.stateId} capture identity mismatch`);
  }
  for (const [scale, receipt] of [
    [1, candidateK1Browser],
    [2, candidateK2Browser],
  ]) {
    invariant(receipt.document.payload.responseStatus >= 200 &&
      receipt.document.payload.responseStatus < 300 &&
      sameIdentity(receipt.document.payload.identity, state.identity) &&
      receipt.document.payload.canvas.renderScale === scale &&
      cleanNetworkSignals(receipt.document.payload.runtimeSignals),
    `${state.stateId} k${scale} browser receipt identity/network mismatch`);
  }
  const document = makeHashBoundDocument(STATE_REPORT_ARTIFACT, {
    evidenceClass: 'adaptive-resolution-state-closure',
    stateId: state.stateId,
    stateIdentitySha256: state.stateIdentitySha256,
    identity: state.identity,
    captures: {
      baseline: {
        path: projectRelative(projectRoot, baseline.path),
        sha256: baseline.sha256,
        contentSha256: baseline.document.contentSha256,
      },
      candidateK1: {
        path: projectRelative(projectRoot, candidateK1.path),
        sha256: candidateK1.sha256,
        contentSha256: candidateK1.document.contentSha256,
        browserReceipt: {
          ...candidateK1Browser,
          document: undefined,
        },
      },
      candidateK2: {
        path: projectRelative(projectRoot, candidateK2.path),
        sha256: candidateK2.sha256,
        contentSha256: candidateK2.document.contentSha256,
        browserReceipt: {
          ...candidateK2Browser,
          document: undefined,
        },
      },
    },
    k1Parity: publicReportBinding(parityBinding),
    k2ScaleComparison: publicReportBinding(comparisonBinding),
    status: 'pass',
    authorityEffects: authorityEffects(),
  });
  await writeOrCheckHashBoundReport({
    projectRoot,
    outputPath: state.stateReport,
    document,
  });
  return document;
}

export async function executeCaptureSetPlan({
  projectRoot = defaultProjectRoot,
  plan,
  browserName = 'chromium',
}, dependencies = {}) {
  verifyHashBoundDocument(plan, CAPTURE_SET_PLAN_ARTIFACT);
  const root = path.resolve(projectRoot);
  await preflightBaselines(root, plan);
  const captureRunner = dependencies.captureRunner ?? captureBrowserCanvasBacking;
  const parityRunner = dependencies.parityRunner ?? verifyCanvasK1Parity;
  const comparisonRunner = dependencies.comparisonRunner ?? compareCanvasScale;
  const placementRunner = dependencies.placementRunner ?? probePlacementActivation;
  const rendererReports = [];
  let completedContactSheetCount = 0;

  for (const renderer of plan.payload.renderers) {
    const stateBindings = [];
    for (const state of renderer.states) {
      const common = {
        mode: 'browser',
        projectRoot: root,
        identity: state.identity,
        stageWidth: plan.payload.contract.nativeWidth,
        stageHeight: plan.payload.contract.nativeHeight,
        check: false,
        url: state.captureUrl,
        browserName,
        selector: `canvas[data-course-canvas="${renderer.animationId}"]`,
        viewport: {width: 1440, height: 900},
        timeoutMs: 30_000,
      };
      await captureRunner({
        ...common,
        outputDirectory: state.candidateK1.outputDirectory,
        scale: 1,
        deviceScaleFactor: 1,
      }, dependencies);
      await captureRunner({
        ...common,
        outputDirectory: state.candidateK2.outputDirectory,
        scale: 2,
        deviceScaleFactor: 2,
      }, dependencies);
      const parity = await parityRunner({
        projectRoot: root,
        baselineManifestPath: state.baselineManifest,
        candidateManifestPath: state.candidateK1.manifest,
        outputPath: state.k1ParityReport,
      });
      const comparison = await comparisonRunner({
        projectRoot: root,
        baselineManifestPath: state.baselineManifest,
        scaledManifestPath: state.candidateK2.manifest,
        thresholdClass: state.thresholdClass,
        outputPath: state.scaleComparisonReport,
      });
      const report = await stateVerificationReport({
        projectRoot: root,
        state,
        parity,
        comparison,
      });
      const binding = await bindHashBoundReport(
        root,
        state.stateReport,
        STATE_REPORT_ARTIFACT,
      );
      stateBindings.push({...binding, document: undefined});
      invariant(report.payload.status === 'pass', `${state.stateId} did not pass`);
    }
    const contactSheetReports = [];
    for (const sheet of renderer.contactSheets) {
      const binding = await renderContactSheet({
        projectRoot: root,
        renderer,
        sheet,
      });
      contactSheetReports.push(publicReportBinding(binding));
    }
    completedContactSheetCount += contactSheetReports.length;
    const rendererReport = makeHashBoundDocument(RENDERER_REPORT_ARTIFACT, {
      evidenceClass: 'adaptive-resolution-renderer-state-closure',
      animationId: renderer.animationId,
      releaseId: renderer.releaseId,
      requirementSource: renderer.requirementSource,
      expectedStateCount: renderer.stateCount,
      completedStateCount: stateBindings.length,
      stateReports: stateBindings,
      expectedContactSheetCount: renderer.contactSheets.length,
      completedContactSheetCount: contactSheetReports.length,
      contactSheetReports,
      visualReviewStatus: 'pending-owner-review',
      status: stateBindings.length === renderer.stateCount &&
        contactSheetReports.length === renderer.contactSheets.length
        ? 'pass'
        : 'fail',
      authorityEffects: authorityEffects(),
    });
    invariant(rendererReport.payload.status === 'pass',
      `${renderer.animationId} state set is incomplete`);
    await writeOrCheckHashBoundReport({
      projectRoot: root,
      outputPath: renderer.rendererReport,
      document: rendererReport,
    });
    const binding = await bindHashBoundReport(
      root,
      renderer.rendererReport,
      RENDERER_REPORT_ARTIFACT,
    );
    rendererReports.push({...binding, document: undefined});
  }

  const placementReports = [];
  for (const placement of plan.payload.placements) {
    const probes = [];
    for (const probe of placement.probes) {
      await placementRunner({
        projectRoot: root,
        placement,
        probe,
        browserName,
      }, dependencies);
      const binding = await bindHashBoundReport(
        root,
        probe.output,
        PLACEMENT_PROBE_ARTIFACT,
      );
      invariant(binding.document.payload.status === 'pass' &&
        binding.document.payload.placement.placementKey === placement.placementKey &&
        binding.document.payload.placement.animationId === placement.animationId,
      `${placement.placementKey} probe identity/status mismatch`);
      probes.push({...binding, document: undefined});
    }
    const rendererBinding = await bindHashBoundReport(
      root,
      placement.rendererReport,
      RENDERER_REPORT_ARTIFACT,
    );
    invariant(rendererBinding.document.payload.status === 'pass' &&
      rendererBinding.document.payload.animationId === placement.animationId,
    `${placement.placementKey} renderer report mismatch`);
    const placementReport = makeHashBoundDocument(PLACEMENT_REPORT_ARTIFACT, {
      evidenceClass: 'adaptive-resolution-placement-closure',
      placement: {
        placementKey: placement.placementKey,
        placementId: placement.placementId,
        releaseId: placement.releaseId,
        ordinal: placement.ordinal,
        animationId: placement.animationId,
      },
      rendererReport: {...rendererBinding, document: undefined},
      expectedProbeCount: placement.probes.length,
      completedProbeCount: probes.length,
      probes,
      status: probes.length === placement.probes.length ? 'pass' : 'fail',
      authorityEffects: authorityEffects(),
    });
    invariant(placementReport.payload.status === 'pass',
      `${placement.placementKey} placement probes are incomplete`);
    await writeOrCheckHashBoundReport({
      projectRoot: root,
      outputPath: placement.placementReport,
      document: placementReport,
    });
    const binding = await bindHashBoundReport(
      root,
      placement.placementReport,
      PLACEMENT_REPORT_ARTIFACT,
    );
    placementReports.push({...binding, document: undefined});
  }

  const report = makeHashBoundDocument(CAPTURE_SET_REPORT_ARTIFACT, {
    evidenceClass: 'production-five-adaptive-resolution-technical-capture-closure',
    captureSetPlan: {
      contentSha256: plan.contentSha256,
      profileSha256: plan.payload.inputs.profile.sha256,
    },
    summary: {
      expectedRendererCount: plan.payload.summary.rendererCount,
      completedRendererCount: rendererReports.length,
      expectedPlacementCount: plan.payload.summary.placementCount,
      completedPlacementCount: placementReports.length,
      expectedStateCount: plan.payload.summary.stateCount,
      expectedContactSheetCount: plan.payload.renderers.reduce(
        (sum, renderer) => sum + renderer.contactSheets.length,
        0,
      ),
      completedContactSheetCount,
      status: rendererReports.length === plan.payload.summary.rendererCount &&
        placementReports.length === plan.payload.summary.placementCount &&
        completedContactSheetCount === plan.payload.renderers.reduce(
          (sum, renderer) => sum + renderer.contactSheets.length,
          0,
        )
        ? 'pass'
        : 'fail',
    },
    rendererReports,
    placementReports,
    contactSheetIndex: plan.payload.outputs.contactSheetIndex,
    ownerVisualReviewStatus: 'pending',
    authorityEffects: authorityEffects(),
  });
  invariant(report.payload.summary.status === 'pass',
    'capture-set renderer/placement closure is incomplete');
  await writeOrCheckHashBoundReport({
    projectRoot: root,
    outputPath: plan.payload.outputs.aggregateReport,
    document: report,
  });
  return report;
}

export async function verifyCompletedCaptureSet({
  projectRoot = defaultProjectRoot,
  plan,
}) {
  verifyHashBoundDocument(plan, CAPTURE_SET_PLAN_ARTIFACT);
  const root = path.resolve(projectRoot);
  const verifiedRendererBindings = [];
  for (const renderer of plan.payload.renderers) {
    const rendererReport = await bindHashBoundReport(
      root,
      renderer.rendererReport,
      RENDERER_REPORT_ARTIFACT,
    );
    invariant(rendererReport.document.payload.status === 'pass' &&
      rendererReport.document.payload.animationId === renderer.animationId &&
      rendererReport.document.payload.completedStateCount === renderer.stateCount &&
      rendererReport.document.payload.completedContactSheetCount ===
        renderer.contactSheets.length,
    `${renderer.animationId} completed report is missing or stale`);
    const verifiedStateBindings = [];
    for (const state of renderer.states) {
      const stateReport = await bindHashBoundReport(
        root,
        state.stateReport,
        STATE_REPORT_ARTIFACT,
      );
      invariant(stateReport.document.payload.status === 'pass' &&
        stateReport.document.payload.stateIdentitySha256 ===
          state.stateIdentitySha256 &&
        sameIdentity(stateReport.document.payload.identity, state.identity),
      `${state.stateId} completed report is missing or stale`);
      const [
        baseline,
        candidateK1,
        candidateK2,
        candidateK1Browser,
        candidateK2Browser,
        parity,
        comparison,
      ] = await Promise.all([
        loadCaptureManifest({
          projectRoot: root,
          manifestPath: state.baselineManifest,
        }),
        loadCaptureManifest({
          projectRoot: root,
          manifestPath: state.candidateK1.manifest,
        }),
        loadCaptureManifest({
          projectRoot: root,
          manifestPath: state.candidateK2.manifest,
        }),
        bindHashBoundReport(
          root,
          state.candidateK1.browserReceipt,
          'canvas-browser-backing-capture-receipt',
        ),
        bindHashBoundReport(
          root,
          state.candidateK2.browserReceipt,
          'canvas-browser-backing-capture-receipt',
        ),
        bindHashBoundReport(
          root,
          state.k1ParityReport,
          'canvas-k1-parity-report',
        ),
        bindHashBoundReport(
          root,
          state.scaleComparisonReport,
          'canvas-scale-comparison-report',
        ),
      ]);
      for (const capture of [baseline, candidateK1, candidateK2]) {
        invariant(sameIdentity(capture.payload.identity, state.identity),
          `${state.stateId} underlying capture identity changed`);
      }
      invariant(baseline.payload.capture.scale === 1 &&
        candidateK1.payload.capture.scale === 1 &&
        candidateK2.payload.capture.scale === 2,
      `${state.stateId} underlying capture scales changed`);
      for (const [scale, receipt] of [
        [1, candidateK1Browser],
        [2, candidateK2Browser],
      ]) {
        invariant(receipt.document.payload.responseStatus >= 200 &&
          receipt.document.payload.responseStatus < 300 &&
          receipt.document.payload.canvas.renderScale === scale &&
          sameIdentity(receipt.document.payload.identity, state.identity) &&
          cleanNetworkSignals(receipt.document.payload.runtimeSignals),
        `${state.stateId} k${scale} browser receipt changed`);
      }
      invariant(parity.document.payload.status === 'pass' &&
        comparison.document.payload.status === 'pass',
      `${state.stateId} parity/RMSE result changed`);
      const recorded = stateReport.document.payload;
      invariant(canonicalJson(recorded.captures.baseline) === canonicalJson(
        captureManifestBinding(root, baseline),
      ) && canonicalJson({
        path: recorded.captures.candidateK1.path,
        sha256: recorded.captures.candidateK1.sha256,
        contentSha256: recorded.captures.candidateK1.contentSha256,
      }) === canonicalJson(captureManifestBinding(root, candidateK1)) &&
        canonicalJson({
          path: recorded.captures.candidateK2.path,
          sha256: recorded.captures.candidateK2.sha256,
          contentSha256: recorded.captures.candidateK2.contentSha256,
        }) === canonicalJson(captureManifestBinding(root, candidateK2)) &&
        canonicalJson(recorded.captures.candidateK1.browserReceipt) ===
          canonicalJson(publicReportBinding(candidateK1Browser)) &&
        canonicalJson(recorded.captures.candidateK2.browserReceipt) ===
          canonicalJson(publicReportBinding(candidateK2Browser)) &&
        canonicalJson(recorded.k1Parity) ===
          canonicalJson(publicReportBinding(parity)) &&
        canonicalJson(recorded.k2ScaleComparison) ===
          canonicalJson(publicReportBinding(comparison)),
      `${state.stateId} state report no longer binds its underlying artifacts`);
      verifiedStateBindings.push(publicReportBinding(stateReport));
    }
    invariant(canonicalJson(rendererReport.document.payload.stateReports) ===
      canonicalJson(verifiedStateBindings),
    `${renderer.animationId} renderer report state bindings changed`);
    const verifiedContactSheets = [];
    for (const sheet of renderer.contactSheets) {
      const manifest = await verifyContactSheet({
        projectRoot: root,
        renderer,
        sheet,
      });
      verifiedContactSheets.push(publicReportBinding(manifest));
    }
    invariant(canonicalJson(
      rendererReport.document.payload.contactSheetReports,
    ) === canonicalJson(verifiedContactSheets),
    `${renderer.animationId} renderer report contact sheet bindings changed`);
    verifiedRendererBindings.push(publicReportBinding(rendererReport));
  }
  const verifiedPlacementBindings = [];
  for (const placement of plan.payload.placements) {
    const placementReport = await bindHashBoundReport(
      root,
      placement.placementReport,
      PLACEMENT_REPORT_ARTIFACT,
    );
    invariant(placementReport.document.payload.status === 'pass' &&
      placementReport.document.payload.placement.placementKey ===
        placement.placementKey &&
      placementReport.document.payload.completedProbeCount ===
        placement.probes.length,
    `${placement.placementKey} completed placement report is missing or stale`);
    const verifiedProbes = [];
    for (const probe of placement.probes) {
      const probeBinding = await bindHashBoundReport(
        root,
        probe.output,
        PLACEMENT_PROBE_ARTIFACT,
      );
      invariant(probeBinding.document.payload.status === 'pass' &&
        probeBinding.document.payload.placement.placementKey ===
          placement.placementKey &&
        probeBinding.document.payload.placement.animationId ===
          placement.animationId &&
        probeBinding.document.payload.locale === probe.locale,
      `${placement.placementKey}/${probe.locale} probe changed`);
      verifiedProbes.push(publicReportBinding(probeBinding));
    }
    invariant(canonicalJson(placementReport.document.payload.probes) ===
      canonicalJson(verifiedProbes),
    `${placement.placementKey} placement report probe bindings changed`);
    verifiedPlacementBindings.push(publicReportBinding(placementReport));
  }
  const aggregate = await bindHashBoundReport(
    root,
    plan.payload.outputs.aggregateReport,
    CAPTURE_SET_REPORT_ARTIFACT,
  );
  const expectedContactSheetCount = plan.payload.renderers.reduce(
    (sum, renderer) => sum + renderer.contactSheets.length,
    0,
  );
  const aggregateSummary = aggregate.document.payload.summary;
  invariant(aggregateSummary.status === 'pass' &&
    aggregateSummary.expectedRendererCount ===
      plan.payload.summary.rendererCount &&
    aggregateSummary.completedRendererCount ===
      verifiedRendererBindings.length &&
    aggregateSummary.expectedPlacementCount ===
      plan.payload.summary.placementCount &&
    aggregateSummary.completedPlacementCount ===
      verifiedPlacementBindings.length &&
    aggregateSummary.expectedStateCount === plan.payload.summary.stateCount &&
    aggregateSummary.expectedContactSheetCount === expectedContactSheetCount &&
    aggregateSummary.completedContactSheetCount === expectedContactSheetCount &&
    aggregate.document.payload.captureSetPlan.contentSha256 ===
      plan.contentSha256 &&
    aggregate.document.payload.captureSetPlan.profileSha256 ===
      plan.payload.inputs.profile.sha256 &&
    aggregate.document.payload.contactSheetIndex ===
      plan.payload.outputs.contactSheetIndex &&
    aggregate.document.payload.ownerVisualReviewStatus === 'pending' &&
    canonicalJson(aggregate.document.payload.rendererReports) ===
      canonicalJson(verifiedRendererBindings) &&
    canonicalJson(aggregate.document.payload.placementReports) ===
      canonicalJson(verifiedPlacementBindings),
  'aggregate capture-set report is missing or stale');
  return aggregate.document;
}

export function usage() {
  return `Usage:
  node scripts/run-canvas-resolution-capture-set.mjs \\
    --base-url <exact-preview-origin> \\
    [--profile <current-js-production-assets.v2.json>] \\
    [--baseline-root <v1-backing-root>] \\
    [--output-root <capture-set-root>] \\
    [--browser <chromium|firefox|webkit>] \\
    [--plan | --execute | --check]

Default mode is --plan. --plan writes a hash-bound 283-renderer/284-placement
capture plan and contact-sheet index without launching a browser. --execute
preflights every v1 baseline, then drives the existing direct-backing capture,
k1 byte-parity, and k2 native-downsample comparison tools plus separate EN/ES
My Lesson placement probes. --check launches no browser and fails unless the
plan, every state/renderer/placement report, and the aggregate report are
present and hash-bound. The active v2 profile and exact five release catalogs
are mandatory; no historical/candidate fallback is inferred.`;
}

export function parseArguments(argv, {projectRoot = defaultProjectRoot} = {}) {
  const valueOptions = new Set([
    '--base-url', '--profile', '--baseline-root', '--output-root', '--browser',
  ]);
  const values = new Map();
  let mode = null;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index];
    if (option === '--help' || option === '-h') {
      invariant(!help, `${option} may be supplied only once`);
      help = true;
      continue;
    }
    if (['--plan', '--execute', '--check'].includes(option)) {
      invariant(mode === null, 'only one of --plan, --execute, or --check is allowed');
      mode = option.slice(2);
      continue;
    }
    invariant(valueOptions.has(option), `Unknown option: ${option}`);
    invariant(!values.has(option), `${option} may be supplied only once`);
    const value = argv[index + 1];
    invariant(value && !value.startsWith('--'), `${option} requires a value`);
    values.set(option, value);
    index += 1;
  }
  if (help) return {help: true, projectRoot: path.resolve(projectRoot)};
  invariant(values.has('--base-url'), '--base-url is required');
  const browserName = values.get('--browser') ?? 'chromium';
  invariant(['chromium', 'firefox', 'webkit'].includes(browserName),
    '--browser must be chromium, firefox, or webkit');
  return {
    projectRoot: path.resolve(projectRoot),
    baseUrl: values.get('--base-url'),
    profilePath: values.get('--profile') ?? DEFAULT_V2_PROFILE,
    baselineRoot: values.get('--baseline-root') ?? DEFAULT_BASELINE_ROOT,
    outputRoot: values.get('--output-root') ?? DEFAULT_OUTPUT_ROOT,
    browserName,
    mode: mode ?? 'plan',
  };
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      console.log(usage());
      return;
    }
    const plan = await buildFileBackedCaptureSetPlan(options);
    await writePlanArtifacts({
      projectRoot: options.projectRoot,
      plan,
      check: options.mode === 'check',
    });
    let report = null;
    if (options.mode === 'execute') {
      report = await executeCaptureSetPlan({
        projectRoot: options.projectRoot,
        plan,
        browserName: options.browserName,
      });
    } else if (options.mode === 'check') {
      report = await verifyCompletedCaptureSet({
        projectRoot: options.projectRoot,
        plan,
      });
    }
    console.log(JSON.stringify({
      status: report?.payload?.summary?.status ?? 'planned',
      mode: options.mode,
      plan: `${options.outputRoot}/capture-set-plan.json`,
      planContentSha256: plan.contentSha256,
      rendererCount: plan.payload.summary.rendererCount,
      placementCount: plan.payload.summary.placementCount,
      requirementCount: plan.payload.summary.requirementCount,
      stateCount: plan.payload.summary.stateCount,
      reportContentSha256: report?.contentSha256,
    }, null, 2));
  } catch (error) {
    console.error(`${error.message}\n\n${usage()}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  await main();
}
