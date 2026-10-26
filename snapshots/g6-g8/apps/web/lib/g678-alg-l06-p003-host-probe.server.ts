import 'server-only';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import path from 'node:path';
import {algL6P001Descriptor} from './g678-alg-l06-p001.server';
import {ALG_L6_P003_CANVAS_SHA256, ALG_L6_P003_ID, ALG_L6_P003_SOURCE_SHA256} from './g678-alg-l06-p003-probe-access';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE = 'G6-G8-shared/ALG001/L6/RW/L6RW03.swf';
const CANDIDATE = '/Volumes/American Dream/hudongpin/g678-p003-candidate-v2.w5AS1a';
const AUDIT = '/Volumes/American Dream/hudongpin/g678-p003-audit.11qugt';
const RUNS = [
  {name: 'source-run-01.mp3', bytes: 190580, sha256: 'f7e602316da5d728766a59bcbb375341beb75e904a43cd8dad051fb7f97efc70'},
  {name: 'source-run-02.mp3', bytes: 73060, sha256: '582fbcd80677d9f58cf4ba41929dc5b57bf77aae7ef193a2a3f447ab0da459db'},
] as const;
function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L6_P003_HOST_PROBE_INVALID: ${reason}`);
}
function readPinned(file: string, sha256: string, byteCount?: number) {
  demand(realpathSync(file) === file, 'physical file');
  const before = lstatSync(file, {bigint: true});
  demand(before.isFile() && !before.isSymbolicLink() && before.nlink === 1n, 'ordinary file');
  const bytes = readFileSync(file), after = lstatSync(file, {bigint: true});
  demand(['dev', 'ino', 'size', 'mtimeNs', 'nlink'].every(key =>
    before[key as keyof typeof before] === after[key as keyof typeof after]), 'stable file');
  demand(createHash('sha256').update(bytes).digest('hex') === sha256 &&
    (byteCount === undefined || bytes.length === byteCount), 'pinned bytes');
  return bytes;
}
function assertScope() {
  demand(process.env.NODE_ENV !== 'production' &&
    process.env.HELP_MATH_G678_SOURCE_ROOT === SOURCE_ROOT &&
    realpathSync(SOURCE_ROOT) === SOURCE_ROOT &&
    !lstatSync(SOURCE_ROOT).isSymbolicLink(), 'real local source root');
  readPinned(path.join(SOURCE_ROOT, SOURCE), ALG_L6_P003_SOURCE_SHA256, 1220637);
}

/** Simulated descriptor for the real My Lesson host. Never write its count to
 * the official registry or return it from generic course listing. */
export function algL6P003HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  assertScope();
  readPinned(path.join(CANDIDATE, 'canvas-renderer.js'), ALG_L6_P003_CANVAS_SHA256);
  const base = algL6P001Descriptor();
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 6 &&
    base.course.activePageCount === 60 && base.pages.length === 60, 'source-ordered lesson');
  const page = base.pages[2];
  demand(page?.animationId === ALG_L6_P003_ID && page.placementId === ALG_L6_P003_ID &&
    page.globalPageOrdinal === 3 && page.sectionCode === 'RW' && page.sectionPageOrdinal === 2 &&
    page.previousPlacementId === 'shared-alg001-l06-p002' &&
    page.source.assetId === `swf-${ALG_L6_P003_SOURCE_SHA256}` &&
    page.rendererAvailability.kind === 'unavailable', 'third source placement');
  const pages = base.pages.map(item => item.animationId === ALG_L6_P003_ID
    ? {...item, rendererAvailability: {kind: 'registered' as const, moduleKey: ALG_L6_P003_ID,
      runtimeQuery: {frameDomain: 'sprite-154', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'}},
      runtimeEvidenceBoundary: {runtimeKind: 'source-static-current-js-candidate' as const,
        actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const,
        audioAcceptance: 'not-established' as const,
        replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established' as const,
        productVisualBehaviorComposite: 'not-established' as const},
      presentation: {pageInteractionCompanionTargetIdSuffix: 'p003-source-readable'}} : item);
  const selected = pages.filter(item => item.rendererAvailability.kind === 'registered').map(item => item.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    selected.includes(ALG_L6_P003_ID), 'probe-only count delta');
  return {...base, descriptorId: `${base.descriptorId}:p003-unregistered-host-probe`,
    calibrationId: 'g678-alg-l06-p003-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p003-unregistered-host-probe`,
    course: {...base.course, href: `/migration-status/g678-calibration/${ALG_L6_P003_ID}`},
    persistence: {...base.persistence, storageKey: `${base.persistence.storageKey}:p003-unregistered-host-probe`},
    pages, productBridge: {...base.productBridge, selectedAnimationIds: selected,
      registeredAnimationCount: selected.length}};
}

export function algL6P003ProbeCanvas() {
  assertScope();
  return readPinned(path.join(CANDIDATE, 'canvas-renderer.js'), ALG_L6_P003_CANVAS_SHA256);
}
export function algL6P003ProbeAudioBase64(): readonly [string, string] {
  assertScope();
  return RUNS.map(run => readPinned(path.join(AUDIT, run.name), run.sha256, run.bytes).toString('base64')) as [string, string];
}
