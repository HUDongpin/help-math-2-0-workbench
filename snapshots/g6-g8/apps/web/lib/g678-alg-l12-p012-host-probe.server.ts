import 'server-only';
import {hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import {splitAdmissionDescriptor} from './g678-split-admission.server';
import {p012AssetManifest} from './g678-alg-l12-p012-assets.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const ALG_L12_P012_ID = 'shared-alg001-l12-p012';
const SOURCE_SHA = 'b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa';
function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`P012_HOST_PROBE_INVALID: ${reason}`);
}

/** One explicit simulated placement in the real My Lesson host. No registry
 * file or predecessor proof changes; this cannot confer formal registration. */
export function p012HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(isG678LocalPreviewEnabled() && !process.env.VERCEL &&
    !hasLocalOnlyAnimationModule(ALG_L12_P012_ID), 'unregistered local candidate only');
  p012AssetManifest();
  const base = splitAdmissionDescriptor('shared-alg001-l12-p010');
  const target = base.pages[11];
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 12 && base.pages.length === 52 &&
    target.animationId === ALG_L12_P012_ID && target.placementId === ALG_L12_P012_ID &&
    target.globalPageOrdinal === 12 && target.sectionPageOrdinal === 6 && target.sectionCode === 'VB' &&
    target.previousPlacementId === 'shared-alg001-l12-p011' && target.nextPlacementId === 'shared-alg001-l12-p013' &&
    target.source.assetId === `swf-${SOURCE_SHA}` && target.rendererAvailability.kind === 'unavailable',
  'exact source-ordered placement');
  demand(base.glossary.filter(entry => entry.sourceKeyAttribute === 'Coordinate').length === 1,
    'source Coordinate dictionary entry');
  demand(Object.values(base.productBridge.acceptanceEffects).every(value => value === false), 'no acceptance promotion');
  const pages = base.pages.map((page, index) => index !== 11 ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L12_P012_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-86', language: 'fixed-en' as const,
        scenario: 'ordered-pairs-interaction', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({runtimeKind: 'source-script-bound-product-behavior-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
      productBehavior: 'maintained-javascript-state-machine-implemented' as const,
      productVisualBehaviorComposite: 'not-established' as const}),
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === base.productBridge.registeredAnimationCount + 1 && new Set(selected).size === selected.length,
    'one simulated candidate only');
  return Object.freeze({...base, descriptorId: `${base.descriptorId}:p012-unregistered-host-probe`,
    calibrationId: 'g678-alg-l12-p012-unregistered-host-probe-v1',
    releaseId: `${base.releaseId}:p012-unregistered-host-probe`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ALG_L12_P012_ID}`}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p012-unregistered-host-probe`}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
