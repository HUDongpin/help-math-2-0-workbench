import 'server-only';
import {g678PartialCalibrationSnapshot} from './g678-calibration-product-bridge.server';
import {loadDatL02P002CandidateAssets} from './g678-dat-l02-p002-candidate.server';
import {hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const DAT_L02_P002_ID = 'shared-dat001-l02-p002';
const SOURCE_SHA = 'b4a8311aff5e33cc623d6035b4a00647bac6ab9dbe0fd61394e6a6207e652a16';

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`DAT_L02_P002_HOST_PROBE_INVALID: ${reason}`);
}

/** Simulated, local-only My Lesson binding. The official registry stays untouched. */
export function datL02P002HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(process.env.NODE_ENV !== 'production' && !process.env.VERCEL_ENV,
    'local-only');
  loadDatL02P002CandidateAssets(); // Exact SWF, source SVG/mask and text closure.
  demand(!hasLocalOnlyAnimationModule(DAT_L02_P002_ID), 'must remain unregistered');
  const snapshot = g678PartialCalibrationSnapshot();
  demand(snapshot.status === 'ready' && snapshot.error === null,
    'calibration baseline');
  const matches = snapshot.descriptors.filter(descriptor =>
    descriptor.course.moduleCode === 'DAT001' && descriptor.course.lesson === 2);
  demand(matches.length === 1, 'one source-ordered lesson');
  const base = matches[0]!;
  const page = base.pages[1];
  demand(base.course.activePageCount === 53 && base.pages.length === 53 &&
    base.productBridge.registeredAnimationCount ===
      base.pages.filter(item => item.rendererAvailability.kind === 'registered').length &&
    page?.animationId === DAT_L02_P002_ID && page.placementId === DAT_L02_P002_ID &&
    page.globalPageOrdinal === 2 && page.sectionCode === 'RW' &&
    page.sectionPageOrdinal === 1 &&
    page.previousPlacementId === 'shared-dat001-l02-p001' &&
    page.nextPlacementId === 'shared-dat001-l02-p003' &&
    page.source.assetId === `swf-${SOURCE_SHA}` &&
    page.rendererAvailability.kind === 'unavailable', 'exact second placement');
  const pages = base.pages.map(item => item.animationId === DAT_L02_P002_ID
    ? {...item, rendererAvailability: {kind: 'registered' as const,
      moduleKey: DAT_L02_P002_ID, runtimeQuery: {
        frameDomain: 'sprite-113', language: 'fixed-en' as const,
        scenario: 'default', seed: '0'}},
      runtimeEvidenceBoundary: {
        runtimeKind: 'source-static-current-js-candidate' as const,
        actionScriptExecution: 'not-executed' as const,
        naturalTraceValidation: 'not-established' as const,
        audioAcceptance: 'not-established' as const,
        replaySemantics: 'product-complete-state-reset-original-runtime-parity-not-established' as const,
        productVisualBehaviorComposite: 'not-established' as const}} : item);
  const selected = pages.filter(item => item.rendererAvailability.kind === 'registered')
    .map(item => item.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    selected.includes(DAT_L02_P002_ID) && new Set(selected).size === selected.length,
    'one probe-only delta');
  return {...base, descriptorId: `${base.descriptorId}:p002-unregistered-host-probe`,
    calibrationId: 'g678-dat-l02-p002-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p002-unregistered-host-probe`,
    course: {...base.course,
      href: `/migration-status/g678-calibration/${DAT_L02_P002_ID}-candidate?host=1`},
    persistence: {...base.persistence,
      storageKey: `${base.persistence.storageKey}:p002-unregistered-host-probe`},
    pages, productBridge: {...base.productBridge, selectedAnimationIds: selected,
      registeredAnimationCount: selected.length}};
}
