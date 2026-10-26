import {
  P055_GLOSSARY_SOURCE_DISPOSITION,
  P055_SOURCE_TERMS,
} from '../../../packages/demos/src/generated/nms-l02-p055-terms-v1';
import type {
  PageOnlyLessonGlossaryEntry,
  PageOnlyLessonPlayerDescriptor,
  WholeLessonPlayerPage,
} from './whole-lesson-player-descriptor';

const ID = 'shared-nms002-l02-p055';
const SOURCE_SHA256 = '8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e';
const XML_SHA256 = '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const PRODUCT_SHA256 = 'a040b5821f4eab812c04bcf47b399235350171c4d83be36bfb1b53e5fdeeb1aa';
const XML_PATH = 'G6-G8-shared/NMS002/L2/index.xml';
const SOURCE_PATH = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS02.swf';
const CALIBRATION = 'g678-nms-l02-p055-conditional-host-current-js-v1';
const FREEZE_PATH = `catalog/product-bridge-calibrations/${CALIBRATION}.json`;

type Pin = Readonly<{path: string; sha256: string; bytes?: number}>;

/** A projection of an independently checked page packet/proof. No file, registry,
 * provider, or environment access occurs in this descriptor extension. */
export interface NmsL02P055DescriptorProvenance {
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

/** Separate from the descriptor schema: this does not represent recovered L2
 * XML or a historically proven original-host glossary result. */
export const P055_DESCRIPTOR_GLOSSARY_QUALIFICATION = Object.freeze({
  ...P055_GLOSSARY_SOURCE_DISPOSITION,
  lessonXmlDeclaredBanks: Object.freeze({
    en: 'HELP_KEYTERMS/KT/XML/L2KTE01.xml',
    es: 'HELP_KEYTERMS/KT/XML/L2KTS01.xml',
  }),
  modernHostSelection: 'conditional-identified-host-L1-bank' as const,
});

function demand(condition: unknown, reason: string): asserts condition {
  if (!condition) throw new Error(`NMS_L02_P055_DESCRIPTOR_INVALID: ${reason}`);
}

function isSha256(value: string): boolean {
  return /^[0-9a-f]{64}$/u.test(value);
}

function sameGlossaryCore(left: PageOnlyLessonGlossaryEntry, right: PageOnlyLessonGlossaryEntry): boolean {
  return left.id === right.id && left.sourceKeyAttribute === right.sourceKeyAttribute &&
    (['en', 'es'] as const).every(locale => left.labels[locale] === right.labels[locale] &&
      left.definitions[locale] === right.definitions[locale] &&
      left.source[locale].assetId === right.source[locale].assetId &&
      left.source[locale].path === right.source[locale].path &&
      left.source[locale].sha256 === right.source[locale].sha256);
}

function verifyProvenance(value: NmsL02P055DescriptorProvenance): void {
  const selected = value.selectedPage;
  demand(value.calibrationId === CALIBRATION, 'calibration ID');
  demand(value.sourceXml.path === XML_PATH && value.sourceXml.sha256 === XML_SHA256 &&
    (value.sourceXml.bytes === undefined || value.sourceXml.bytes === 12845), 'source XML pin');
  demand(value.source.path === SOURCE_PATH && value.source.sha256 === SOURCE_SHA256 &&
    value.source.bytes === 149059, 'P055 SWF pin');
  demand(selected.animationId === ID && selected.placementId === ID &&
    selected.assetId === `swf-${SOURCE_SHA256}` && selected.sourceSha256 === SOURCE_SHA256 &&
    selected.globalPageOrdinal === 55 && selected.sourceOccurrence === 55 &&
    selected.sectionCode === 'TS' && selected.sectionPageOrdinal === 1, 'selected P055 source placement');
  const runtime = selected.runtime;
  demand(runtime.frameDomain === 'sprite-26' && runtime.frameCount === 351 &&
    runtime.rootBeginFrame === 6 && runtime.fps === 12 &&
    runtime.stage.width === 800 && runtime.stage.height === 600 &&
    runtime.scenario === 'source-static-frame', 'selected P055 runtime');
  demand(value.freeze.path === FREEZE_PATH && isSha256(value.freeze.sha256), 'freeze pin');
  demand(value.glossary.candidateSha256 === P055_GLOSSARY_SOURCE_DISPOSITION.candidateSha256 &&
    value.glossary.product.path === 'packages/demos/src/generated/nms-l02-p055-terms-v1.ts' &&
    value.glossary.product.sha256 === PRODUCT_SHA256 &&
    value.glossary.product.bytes === 4326 &&
    value.glossary.sourceSelection === P055_GLOSSARY_SOURCE_DISPOSITION.sourceSelection &&
    value.glossary.originalL2XmlResolved === false &&
    value.glossary.historicalHostAssociationEstablished === false &&
    value.glossary.originalRuntimeLookupVerified === false, 'conditional glossary pin');
}

/** Pure source-ordered P055 extension. The caller must first verify every
 * byte pin and the actual registry entry referenced by `provenance`. */
export function extendNmsL02P055Descriptor(
  base: PageOnlyLessonPlayerDescriptor,
  provenance: NmsL02P055DescriptorProvenance,
): PageOnlyLessonPlayerDescriptor {
  verifyProvenance(provenance);
  const target = base.pages[54];
  demand(base.schemaVersion === 2 && base.course.moduleCode === 'NMS002' &&
    base.course.lesson === 2 && base.course.activePageCount === 64 &&
    base.course.expectedReleaseMemberCount === 64 && base.course.courseShellCount === 0 &&
    base.pages.length === 64 && base.productBridge.pageOnlyDescriptorMemberCount === 64 &&
    base.productBridge.registeredAnimationCount === 54, 'P052 predecessor counts');
  demand(base.source.sourceXmlPath === XML_PATH &&
    base.source.sourceXmlSha256 === XML_SHA256 &&
    base.source.sourceXmlSha256 === provenance.sourceXml.sha256, 'predecessor source XML');
  demand(base.pages.every((page, index) => page.globalPageOrdinal === index + 1) &&
    new Set(base.pages.map(page => page.placementId ?? page.animationId)).size === 64, 'source order');
  demand(target?.animationId === ID && target.placementId === ID &&
    target.globalPageOrdinal === 55 && target.sectionCode === 'TS' &&
    target.sectionPageOrdinal === 1 && target.source.sourceOccurrence === 55 &&
    target.source.assetId === `swf-${SOURCE_SHA256}` &&
    target.previousPlacementId === 'shared-nms002-l02-p054' &&
    target.nextPlacementId === 'shared-nms002-l02-p056' &&
    base.pages[53].placementId === target.previousPlacementId &&
    base.pages[55].placementId === target.nextPlacementId &&
    target.rendererAvailability.kind === 'unavailable', 'unavailable exact P055 placement');
  const registeredBefore = base.pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(registeredBefore.length === 54 &&
    JSON.stringify(registeredBefore) === JSON.stringify(base.productBridge.selectedAnimationIds) &&
    new Set(registeredBefore).size === 54, 'registered predecessor order');
  demand(Object.values(base.productBridge.acceptanceEffects).every(value => value === false), 'predecessor acceptance boundary');

  const glossary: PageOnlyLessonGlossaryEntry[] = [...base.glossary];
  demand(new Set(glossary.map(term => term.id)).size === glossary.length &&
    new Set(glossary.map(term => term.sourceKeyAttribute)).size === glossary.length, 'predecessor glossary uniqueness');
  for (const term of P055_SOURCE_TERMS) {
    const byId = glossary.find(existing => existing.id === term.id);
    const byKey = glossary.find(existing => existing.sourceKeyAttribute === term.sourceKeyAttribute);
    demand((!byId && !byKey) || (byId === byKey && byId !== undefined && sameGlossaryCore(byId, term)),
      `glossary collision: ${term.id}`);
    if (!byId) glossary.push(term);
  }

  const pages: WholeLessonPlayerPage[] = base.pages.map((page, index) => index !== 54 ? page : Object.freeze({
    ...page,
    rendererAvailability: Object.freeze({kind: 'registered' as const, moduleKey: ID,
      runtimeQuery: Object.freeze({frameDomain: 'sprite-26', language: 'fixed-en' as const,
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
  const registeredAfter = pages.filter(page => page.rendererAvailability.kind === 'registered').map(page => page.animationId);
  demand(registeredAfter.length === 55 && new Set(registeredAfter).size === 55, 'P055 registration delta');
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
    pages: Object.freeze(pages),
    glossary: Object.freeze(glossary),
    productBridge: Object.freeze({...base.productBridge,
      selectedAnimationIds: Object.freeze(registeredAfter), registeredAnimationCount: 55}),
  });
}
