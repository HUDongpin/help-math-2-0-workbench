import 'server-only';
import {validateP012AdmissionSemantics} from '../../../lib/g678-p012-admission-semantics.mjs';
import type {PageOnlyLessonPlayerDescriptor} from './whole-lesson-player-descriptor';

/** Called only after the common reader verifies this page's exact current
 * registration, physical source pins and frozen implementation closure. */
export function extendP012Admission(base: PageOnlyLessonPlayerDescriptor, packet: unknown, registration: unknown): PageOnlyLessonPlayerDescriptor {
  validateP012AdmissionSemantics(packet, registration);
  const id = 'shared-alg001-l12-p012';
  const target = base.pages[11];
  if (base.pages.length !== 52 || base.productBridge.registeredAnimationCount !== 22 ||
    base.glossary.length !== 44 || base.course.moduleCode !== 'ALG001' || base.course.lesson !== 12 ||
    target.animationId !== id || target.placementId !== id || target.globalPageOrdinal !== 12 ||
    target.sectionCode !== 'VB' || target.sectionPageOrdinal !== 6 ||
    target.source.assetId !== 'swf-b322949a960acef3fee6018a65785b29cd3693717ca3ba33d0d930d7866320aa' ||
    target.previousPlacementId !== 'shared-alg001-l12-p011' || target.nextPlacementId !== 'shared-alg001-l12-p013' ||
    target.rendererAvailability.kind !== 'unavailable' ||
    base.glossary.filter(entry => entry.sourceKeyAttribute === 'Coordinate').length !== 1 ||
    Object.values(base.productBridge.acceptanceEffects).some(value => value !== false))
    throw Error('P012_ADMISSION_PREDECESSOR_MISMATCH');
  const pages = base.pages.map((page, index) => index !== 11 ? page : Object.freeze({...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: id,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-86', language: 'fixed-en' as const,
        scenario: 'ordered-pairs-interaction', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-product-behavior-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const, naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
      productBehavior: 'maintained-javascript-state-machine-implemented' as const,
      productVisualBehaviorComposite: 'not-established' as const,
    }),
  }));
  const selected = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  return Object.freeze({...base, descriptorId: `${base.descriptorId}:p012-current-js-v1`,
    calibrationId: 'g678-alg-l12-p012-current-js-v1', releaseId: `${base.releaseId}:p012-current-js-v1`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${id}`}),
    persistence: Object.freeze({...base.persistence, storageKey: `${base.persistence.storageKey}:p012-current-js-v1`}),
    pages: Object.freeze(pages), productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(selected), registeredAnimationCount: selected.length}),
  });
}
