import 'server-only';
import {hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import {P010_GLOSSARY_TERMS} from '../../../packages/demos/src/alg-l12-p010-glossary';
import {algL12P009CurrentJsDescriptor} from './g678-alg-l12-p009-current-js-v2.server';
import {algL12P010Typography} from './g678-alg-l12-p010-typography.server';
import {supplementP010Glossary} from './g678-alg-l12-p010-glossary.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const ALG_L12_P010_ID = 'shared-alg001-l12-p010';
const SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P010_HOST_PROBE_INVALID: ${reason}`);
}

/** One simulated page in the retained modern My Lesson host; no registry write. */
export function algL12P010HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(isG678LocalPreviewEnabled() && !hasLocalOnlyAnimationModule(ALG_L12_P010_ID), 'unregistered local-only probe');
  algL12P010Typography();
  const base = algL12P009CurrentJsDescriptor();
  const glossary = supplementP010Glossary(base.glossary);
  const target = base.pages[9];
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 12 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 21 &&
    target?.animationId === ALG_L12_P010_ID && target.placementId === ALG_L12_P010_ID &&
    target.globalPageOrdinal === 10 && target.sectionCode === 'VB' && target.sectionPageOrdinal === 4 &&
    target.previousPlacementId === 'shared-alg001-l12-p009' && target.nextPlacementId === 'shared-alg001-l12-p011' &&
    target.source.assetId === `swf-${SOURCE_SHA}` && target.rendererAvailability.kind === 'unavailable',
  'exact tenth source placement and predecessor');
  for (const term of P010_GLOSSARY_TERMS)
    demand(glossary.filter(entry => entry.sourceKeyAttribute === term.sourceKeyAttribute).length === 1,
      `one source dictionary entry for ${term.sourceKeyAttribute}`);
  const pages = base.pages.map((page, index) => index === 9 ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L12_P010_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-96', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({runtimeKind: 'source-static-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'renderer-restart-only-source-behavior-not-established' as const,
      productVisualBehaviorComposite: 'not-established' as const}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 22 && new Set(selected).size === 22 &&
    selected.filter(id => id !== ALG_L12_P010_ID).every(id => base.productBridge.selectedAnimationIds.includes(id)) &&
    Object.values(base.productBridge.acceptanceEffects).every(value => value === false), 'one simulated page, no accepted gates');
  return Object.freeze({...base, descriptorId: `${base.descriptorId}:p010-unregistered-host-probe`,
    calibrationId: 'g678-alg-l12-p010-unregistered-host-probe-v1', releaseId: `${base.releaseId}:p010-unregistered-host-probe`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ALG_L12_P010_ID}`}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p010-unregistered-host-probe`}),
    pages: Object.freeze(pages), glossary, productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
