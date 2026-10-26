import {
  P057_GLOSSARY_SOURCE_DISPOSITION,
  P057_SOURCE_TERMS,
} from '../../../packages/demos/src/generated/nms-l02-p057-terms-v1';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

const ID = 'shared-nms002-l02-p057';
const SOURCE_SHA256 = '9cc456a0af745dc31240b3a6d805e8e115c1c1c2725f851fca8e907a767820aa';
const XML_SHA256 = '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const PRODUCT_SHA256 = '177cbcdef722656206b29da8a31a643ef6a3555c13decb5d21ff5b7db2285ee7';
const XML_PATH = 'G6-G8-shared/NMS002/L2/index.xml';
const SOURCE_PATH = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS04.swf';
const CALIBRATION = 'g678-nms-l02-p057-conditional-host-current-js-v1';
const FREEZE_PATH = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;
const pageId = (ordinal: number) => `shared-nms002-l02-p${String(ordinal).padStart(3, '0')}`;
const EXPECTED_REGISTERED_BEFORE = Object.freeze([
  ...Array.from({length: 52}, (_, index) => pageId(index + 1)),
  pageId(55), pageId(56), pageId(59), pageId(63),
]);

type Pin = Readonly<{path: string; sha256: string; bytes?: number}>;

/** Supplied by a separately verified P057 page proof. This projection never
 * reads files, the registry, the environment, or a provider. */
export interface NmsL02P057DescriptorProvenance {
  readonly calibrationId: string;
  readonly sourceXml: Pin;
  readonly source: Pin;
  readonly selectedPage: Readonly<{
    animationId: string;
    placementId: string;
    assetId: string;
    globalPageOrdinal: number;
    sectionCode: string;
    sectionPageOrdinal: number;
    sourceOccurrence: number;
    sourceSha256: string;
    runtime: Readonly<{
      frameDomain: string;
      frameCount: number;
      rootBeginFrame: number;
      fps: number;
      stage: Readonly<{width: number; height: number}>;
      scenario: string;
    }>;
  }>;
  readonly freeze: Pin;
  readonly glossary: Readonly<{
    candidateSha256: string;
    product: Pin;
    sourceSelection: string;
    originalL2XmlResolved: false;
    historicalHostAssociationEstablished: false;
    originalRuntimeLookupVerified: false;
  }>;
}

/** Host-selected L1 definitions are qualified candidate data, not recovered
 * L2 dictionary XML or a proven historical Flash lookup. */
export const P057_DESCRIPTOR_GLOSSARY_QUALIFICATION = Object.freeze({
  ...P057_GLOSSARY_SOURCE_DISPOSITION,
  lessonXmlDeclaredBanks: Object.freeze({
    en: 'HELP_KEYTERMS/KT/XML/L2KTE01.xml',
    es: 'HELP_KEYTERMS/KT/XML/L2KTS01.xml',
  }),
  modernHostSelection: 'conditional-identified-host-L1-bank' as const,
});

function demand(condition: unknown, reason: string): asserts condition {
  if (!condition) throw Error(`NMS_L02_P057_DESCRIPTOR_INVALID: ${reason}`);
}
const isSha256 = (value: string) => /^[0-9a-f]{64}$/u.test(value);

function sameGlossaryCore(left: PageOnlyLessonGlossaryEntry, right: PageOnlyLessonGlossaryEntry): boolean {
  return left.id === right.id && left.sourceKeyAttribute === right.sourceKeyAttribute &&
    (['en', 'es'] as const).every(locale => left.labels[locale] === right.labels[locale] &&
      left.definitions[locale] === right.definitions[locale] &&
      left.source[locale].assetId === right.source[locale].assetId &&
      left.source[locale].path === right.source[locale].path &&
      left.source[locale].sha256 === right.source[locale].sha256);
}

function verifyProvenance(value: NmsL02P057DescriptorProvenance): void {
  const selected = value.selectedPage;
  demand(value.calibrationId === CALIBRATION, 'calibration ID');
  demand(value.sourceXml.path === XML_PATH && value.sourceXml.sha256 === XML_SHA256 &&
    value.sourceXml.bytes === 12845, 'source XML pin');
  demand(value.source.path === SOURCE_PATH && value.source.sha256 === SOURCE_SHA256 &&
    value.source.bytes === 137055, 'P057 SWF pin');
  demand(selected.animationId === ID && selected.placementId === ID &&
    selected.assetId === `swf-${SOURCE_SHA256}` && selected.sourceSha256 === SOURCE_SHA256 &&
    selected.globalPageOrdinal === 57 && selected.sourceOccurrence === 57 &&
    selected.sectionCode === 'TS' && selected.sectionPageOrdinal === 3, 'selected P057 source placement');
  const runtime = selected.runtime;
  demand(runtime.frameDomain === 'sprite-66' && runtime.frameCount === 328 &&
    runtime.rootBeginFrame === 6 && runtime.fps === 12 &&
    runtime.stage.width === 800 && runtime.stage.height === 600 &&
    runtime.scenario === 'source-static-frame', 'selected P057 runtime');
  demand(value.freeze.path === FREEZE_PATH && isSha256(value.freeze.sha256), 'freeze pin');
  demand(value.glossary.candidateSha256 === P057_GLOSSARY_SOURCE_DISPOSITION.candidateSha256 &&
    value.glossary.product.path === 'packages/demos/src/generated/nms-l02-p057-terms-v1.ts' &&
    value.glossary.product.sha256 === PRODUCT_SHA256 &&
    value.glossary.product.bytes === 8325 &&
    value.glossary.sourceSelection === P057_GLOSSARY_SOURCE_DISPOSITION.sourceSelection &&
    value.glossary.originalL2XmlResolved === false &&
    value.glossary.historicalHostAssociationEstablished === false &&
    value.glossary.originalRuntimeLookupVerified === false, 'conditional glossary pin');
}

/** Extend the verified 56-page P056 lesson descriptor by exactly P057. The
 * caller owns physical pin, real registry, and page-proof verification. */
export function extendNmsL02P057Descriptor(
  base: PageOnlyLessonPlayerDescriptor,
  provenance: NmsL02P057DescriptorProvenance,
): PageOnlyLessonPlayerDescriptor {
  verifyProvenance(provenance);
  demand(base.schemaVersion === 2 && base.course.moduleCode === 'NMS002' &&
    base.course.lesson === 2 && base.course.activePageCount === 64 &&
    base.course.expectedReleaseMemberCount === 64 && base.course.courseShellCount === 0 &&
    base.pages.length === 64 && base.productBridge.pageOnlyDescriptorMemberCount === 64 &&
    base.productBridge.registeredAnimationCount === 56, 'P056 predecessor counts');
  demand(base.source.sourceXmlPath === XML_PATH &&
    base.source.sourceXmlSha256 === XML_SHA256 &&
    base.source.sourceXmlSha256 === provenance.sourceXml.sha256, 'predecessor source XML');
  demand(base.pages.every((page, index) => {
    const ordinal = index + 1;
    const previous = ordinal === 1 ? null : pageId(ordinal - 1);
    const next = ordinal === 64 ? null : pageId(ordinal + 1);
    return page.animationId === pageId(ordinal) && page.placementId === pageId(ordinal) &&
      page.globalPageOrdinal === ordinal && page.source.sourceOccurrence === ordinal &&
      page.previousPlacementId === previous && page.nextPlacementId === next &&
      page.previousAnimationId === previous && page.nextAnimationId === next;
  }), '64-page source order and links');
  const target = base.pages[56];
  demand(target.animationId === ID && target.sectionCode === 'TS' &&
    target.sectionPageOrdinal === 3 && target.source.assetId === `swf-${SOURCE_SHA256}` &&
    target.rendererAvailability.kind === 'unavailable', 'unavailable exact P057 placement');
  const registeredBefore = base.pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(JSON.stringify(registeredBefore) === JSON.stringify(EXPECTED_REGISTERED_BEFORE) &&
    JSON.stringify(base.productBridge.selectedAnimationIds) === JSON.stringify(EXPECTED_REGISTERED_BEFORE),
    'registered P056 predecessor identity and order');
  const acceptance = base.productBridge.acceptanceEffects;
  demand(acceptance.authoritativeOriginalRuntime === false && acceptance.fidelityAccepted === false &&
    acceptance.audioAccepted === false && acceptance.humanVisualAccepted === false &&
    acceptance.ownerAccepted === false && acceptance.strictComplete === false &&
    acceptance.published === false && Object.values(acceptance).every(value => value === false),
    'predecessor acceptance boundary');

  const glossary: PageOnlyLessonGlossaryEntry[] = [...base.glossary];
  demand(new Set(glossary.map(term => term.id)).size === glossary.length &&
    new Set(glossary.map(term => term.sourceKeyAttribute)).size === glossary.length,
    'predecessor glossary uniqueness');
  for (const term of P057_SOURCE_TERMS) {
    const byId = glossary.find(existing => existing.id === term.id);
    const byKey = glossary.find(existing => existing.sourceKeyAttribute === term.sourceKeyAttribute);
    demand((!byId && !byKey) ||
      (byId === byKey && byId !== undefined && sameGlossaryCore(byId, term)),
    `glossary collision: ${term.id}`);
    if (!byId) glossary.push(term);
  }
  const pages: WholeLessonPlayerPage[] = base.pages.map((page, index) => index !== 56 ? page : Object.freeze({
    ...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-66', language: 'fixed-en' as const,
        scenario: 'source-static-frame', seed: '0'})}),
    runtimeEvidenceBoundary: Object.freeze({
      runtimeKind: 'source-script-bound-product-behavior-current-js-candidate' as const,
      actionScriptExecution: 'not-executed' as const,
      naturalTraceValidation: 'not-established' as const,
      audioAcceptance: 'not-established' as const,
      replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established' as const,
      productBehavior: 'maintained-javascript-state-machine-implemented' as const,
      productVisualBehaviorComposite: 'not-established' as const,
    }),
  }));
  const registeredAfter = pages.filter(page => page.rendererAvailability.kind === 'registered')
    .map(page => page.animationId);
  demand(registeredAfter.length === 57 &&
    JSON.stringify(registeredAfter) === JSON.stringify([
      ...EXPECTED_REGISTERED_BEFORE.slice(0, 54), ID, ...EXPECTED_REGISTERED_BEFORE.slice(54),
    ]), 'P057 registration delta');
  return Object.freeze({
    ...base,
    descriptorId: `${base.descriptorId}:${provenance.calibrationId}`,
    calibrationId: provenance.calibrationId,
    releaseId: `${base.releaseId}:${provenance.calibrationId}`,
    course: Object.freeze({...base.course, href: `/migration-status/g678-calibration/${ID}`}),
    source: Object.freeze({...base.source,
      candidateFreezeManifestPath: provenance.freeze.path,
      candidateFreezeManifestSha256: provenance.freeze.sha256}),
    persistence: Object.freeze({...base.persistence,
      storageKey: `${base.persistence.storageKey}:${provenance.calibrationId}`}),
    pages: Object.freeze(pages), glossary: Object.freeze(glossary),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(registeredAfter), registeredAnimationCount: 57}),
  });
}
