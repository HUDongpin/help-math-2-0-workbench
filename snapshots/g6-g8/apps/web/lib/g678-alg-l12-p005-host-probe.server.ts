import 'server-only';

import {hasLocalOnlyAnimationModule} from
  '@helpmath/demos/local-only-animation-registry-metadata';
import {SHARED_ALG001_L12_P005_CONFIG, SHARED_ALG001_L12_P005_SOURCE} from
  '../../../packages/demos/src/timelines/shared-alg001-l12-p005';
import {algL12P003Descriptor} from './g678-alg-l12-p003.server';
import {algL12P005Canvas} from './g678-alg-l12-p005.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const ALG_L12_P005_ID = 'shared-alg001-l12-p005';
const SOURCE_SHA256 = 'b411401131b484ee693063b46fdbbbdbc45f81fc265512a17ae0a379dbad2dfe';
const RUNTIME_SHA256 = '48efbca3ddebf218565cdd635ffa130ae3a402c5693dd1ebcf359b2c30d500dd';

function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P005_HOST_PROBE_INVALID: ${reason}`);
}

/** Simulates only P005 in the real local My Lesson host. No registry write. */
export function algL12P005HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(isG678LocalPreviewEnabled(), 'local loopback opt-in required');
  demand(SHARED_ALG001_L12_P005_SOURCE.currentJavaScriptRegistered === false &&
    SHARED_ALG001_L12_P005_SOURCE.productCalibrationPassed === false &&
    SHARED_ALG001_L12_P005_SOURCE.audioPlaybackEnabled === false &&
    SHARED_ALG001_L12_P005_SOURCE.strictAcceptanceEffect === 'none' &&
    SHARED_ALG001_L12_P005_SOURCE.spanishTextPolicy ===
      'english-source-fallback-translation-pending' &&
    SHARED_ALG001_L12_P005_SOURCE.source.sha256 === SOURCE_SHA256 &&
    SHARED_ALG001_L12_P005_CONFIG.animationId === ALG_L12_P005_ID &&
    SHARED_ALG001_L12_P005_CONFIG.assetSha256 === RUNTIME_SHA256 &&
    !hasLocalOnlyAnimationModule(ALG_L12_P005_ID),
  'source candidate must remain unregistered and unaccepted');
  const runtime = algL12P005Canvas(); // Checks physical SWF and pinned v2 bytes.
  demand(runtime.sha256 === RUNTIME_SHA256 && runtime.bytes.length === 19449678,
    'mask-corrected v2 runtime');

  const base = algL12P003Descriptor();
  const target = base.pages[4];
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 12 &&
    base.course.activePageCount === 52 && base.pages.length === 52 &&
    base.productBridge.pageOnlyDescriptorMemberCount === 52 &&
    base.productBridge.registeredAnimationCount === 19 &&
    base.productBridge.registeredAnimationCount === base.pages.filter(page =>
      page.rendererAvailability.kind === 'registered').length &&
    target?.animationId === ALG_L12_P005_ID &&
    target.placementId === ALG_L12_P005_ID &&
    target.globalPageOrdinal === 5 && target.sectionCode === 'RW' &&
    target.sectionPageOrdinal === 4 &&
    target.previousPlacementId === 'shared-alg001-l12-p004' &&
    target.nextPlacementId === 'shared-alg001-l12-p006' &&
    target.source.assetId === `swf-${SOURCE_SHA256}` &&
    target.rendererAvailability.kind === 'unavailable',
  'exact fifth source placement in P003 predecessor');

  const pages = base.pages.map((page, index) => index === 4
    ? Object.freeze({...page,
      rendererAvailability: Object.freeze({kind: 'registered' as const,
        moduleKey: ALG_L12_P005_ID,
        runtimeQuery: Object.freeze({
          frameDomain: SHARED_ALG001_L12_P005_CONFIG.mainFrameDomain,
          language: 'fixed-en' as const,
          scenario: 'source-static-frame', seed: '0',
        })}),
      runtimeEvidenceBoundary: Object.freeze({
        runtimeKind: 'source-static-current-js-candidate' as const,
        actionScriptExecution: 'not-executed' as const,
        naturalTraceValidation: 'not-established' as const,
        audioAcceptance: 'not-established' as const,
        replaySemantics: 'renderer-restart-only-source-behavior-not-established' as const,
        productVisualBehaviorComposite: 'not-established' as const,
      }),
    }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 &&
    selected.length === new Set(selected).size && selected[4] === ALG_L12_P005_ID &&
    selected.filter(id => id !== ALG_L12_P005_ID).every(id =>
      base.productBridge.selectedAnimationIds.includes(id)) &&
    Object.values(base.productBridge.acceptanceEffects).every(value => value === false),
  'one simulated page and no accepted gates');

  return Object.freeze({...base,
    descriptorId: `${base.descriptorId}:p005-unregistered-host-probe`,
    calibrationId: 'g678-alg-l12-p005-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p005-unregistered-host-probe`,
    course: Object.freeze({...base.course,
      href: `/migration-status/g678-calibration/${ALG_L12_P005_ID}`}),
    persistence: Object.freeze({...base.persistence,
      storageKey: `${base.persistence.storageKey}:p005-unregistered-host-probe`}),
    pages: Object.freeze(pages),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected),
      registeredAnimationCount: selected.length}),
  });
}
