import 'server-only';
import {hasLocalOnlyAnimationModule} from '@helpmath/demos/local-only-animation-registry-metadata';
import {P009_GLOSSARY_TERMS} from '../../../packages/demos/src/alg-l12-p009-glossary';
import {algL12P006CurrentJsDescriptor} from './g678-alg-l12-p006-current-js.server';
import {algL12P009Typography} from './g678-alg-l12-p009-typography.server';
import {supplementP009Glossary} from './g678-alg-l12-p009-glossary.server';
import {isG678LocalPreviewEnabled} from './g678-preview-policy';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

export const ALG_L12_P009_ID = 'shared-alg001-l12-p009';
const SOURCE_SHA = 'd8bb6bfb4632fc528a0e14092277d95b2d96998aaeab2f0c1252a0233f35f533';
function demand(value: unknown, reason: string): asserts value {
  if (!value) throw Error(`ALG_L12_P009_HOST_PROBE_INVALID: ${reason}`);
}

/** One simulated page in the retained modern My Lesson host; no registry write. */
export function algL12P009HostProbeDescriptor(): PageOnlyLessonPlayerDescriptor {
  demand(isG678LocalPreviewEnabled() && !hasLocalOnlyAnimationModule(ALG_L12_P009_ID), 'unregistered local-only probe');
  algL12P009Typography();
  const base = algL12P006CurrentJsDescriptor();
  const glossary = supplementP009Glossary(base.glossary);
  const target = base.pages[8];
  demand(base.course.moduleCode === 'ALG001' && base.course.lesson === 12 && base.pages.length === 52 &&
    base.productBridge.registeredAnimationCount === 20 &&
    target?.animationId === ALG_L12_P009_ID && target.placementId === ALG_L12_P009_ID &&
    target.globalPageOrdinal === 9 && target.sectionCode === 'VB' && target.sectionPageOrdinal === 3 &&
    target.previousPlacementId === 'shared-alg001-l12-p008' && target.nextPlacementId === 'shared-alg001-l12-p010' &&
    target.source.assetId === `swf-${SOURCE_SHA}` && target.rendererAvailability.kind === 'unavailable',
  'exact ninth source placement and predecessor');
  for (const term of P009_GLOSSARY_TERMS)
    demand(glossary.filter(entry => entry.sourceKeyAttribute === term.sourceKeyAttribute).length === 1,
      `one source dictionary entry for ${term.sourceKeyAttribute}`);
  const pages = base.pages.map((page, index) => index === 8 ? Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ALG_L12_P009_ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-62', language: 'fixed-en' as const, scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({runtimeKind: 'source-static-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'renderer-restart-only-source-behavior-not-established' as const,
      productVisualBehaviorComposite: 'not-established' as const}),
  }) : page);
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(selected.length === 21 && new Set(selected).size === 21 &&
    selected.filter(id => id !== ALG_L12_P009_ID).every(id => base.productBridge.selectedAnimationIds.includes(id)) &&
    Object.values(base.productBridge.acceptanceEffects).every(value => value === false), 'one simulated page, no accepted gates');
  return Object.freeze({...base, descriptorId: `${base.descriptorId}:p009-unregistered-host-probe`,
    calibrationId: 'g678-alg-l12-p009-unregistered-host-probe-v1', releaseId: `${base.releaseId}:p009-unregistered-host-probe`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ALG_L12_P009_ID}`}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p009-unregistered-host-probe`}),
    pages: Object.freeze(pages), glossary, productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
