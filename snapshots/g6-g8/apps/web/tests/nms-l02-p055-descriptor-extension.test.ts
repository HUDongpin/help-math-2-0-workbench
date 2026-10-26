import assert from 'node:assert/strict';
import {test} from 'node:test';
import {P055_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p055-terms-v1';
import {
  extendNmsL02P055Descriptor,
  P055_DESCRIPTOR_GLOSSARY_QUALIFICATION,
  type NmsL02P055DescriptorProvenance,
} from '../lib/nms-l02-p055-descriptor-extension';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const SOURCE_SHA256 = '8581db0c66f2b9640eb8ea244e22ec6831d0cb98d1fd9b3fb60b15bcc745758e';
const XML_SHA256 = '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const id = (ordinal: number) => `shared-nms002-l02-p${String(ordinal).padStart(3, '0')}`;

function predecessor(): PageOnlyLessonPlayerDescriptor {
  const pages = Array.from({length: 64}, (_, index) => {
    const ordinal = index + 1;
    const animationId = id(ordinal);
    return {
      animationId, placementId: animationId,
      previousPlacementId: ordinal === 1 ? null : id(ordinal - 1),
      nextPlacementId: ordinal === 64 ? null : id(ordinal + 1),
      globalPageOrdinal: ordinal,
      sectionCode: ordinal >= 55 ? 'TS' : 'TI',
      sectionPageOrdinal: ordinal >= 55 ? ordinal - 54 : ordinal,
      source: {assetId: ordinal === 55 ? `swf-${SOURCE_SHA256}` : `swf-test-${ordinal}`,
        sourceOccurrence: ordinal},
      rendererAvailability: ordinal <= 54
        ? {kind: 'registered', moduleKey: animationId}
        : {kind: 'unavailable', reason: 'test predecessor'},
    };
  });
  return {
    schemaVersion: 2,
    descriptorId: 'nms-l02-p052',
    calibrationId: 'g678-nms-l02-p052-current-js-v1',
    releaseId: 'nms-l02-p052-local',
    course: {moduleCode: 'NMS002', lesson: 2, activePageCount: 64,
      expectedReleaseMemberCount: 64, courseShellCount: 0,
      href: `/migration-status/g678-calibration/${id(52)}`},
    source: {sourceXmlPath: 'G6-G8-shared/NMS002/L2/index.xml', sourceXmlSha256: XML_SHA256},
    persistence: {storageKey: 'nms-l02-p052-local'},
    pages,
    glossary: [P055_SOURCE_TERMS[2]], // Existing exact Problem must be reused.
    productBridge: {
      pageOnlyDescriptorMemberCount: 64,
      registeredAnimationCount: 54,
      selectedAnimationIds: pages.slice(0, 54).map(page => page.animationId),
      acceptanceEffects: {authoritativeOriginalRuntime: false, fidelityAccepted: false,
        audioAccepted: false, humanVisualAccepted: false, ownerAccepted: false,
        strictComplete: false, published: false},
    },
  } as unknown as PageOnlyLessonPlayerDescriptor;
}

function provenance(): NmsL02P055DescriptorProvenance {
  return {
    calibrationId: 'g678-nms-l02-p055-conditional-host-current-js-v1',
    sourceXml: {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845, sha256: XML_SHA256},
    source: {path: '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS02.swf', bytes: 149059, sha256: SOURCE_SHA256},
    selectedPage: {animationId: id(55), placementId: id(55), globalPageOrdinal: 55,
      sectionCode: 'TS', sectionPageOrdinal: 1, sourceOccurrence: 55,
      assetId: `swf-${SOURCE_SHA256}`, sourceSha256: SOURCE_SHA256,
      runtime: {frameDomain: 'sprite-26', frameCount: 351, rootBeginFrame: 6,
        fps: 12, stage: {width: 800, height: 600}, scenario: 'source-static-frame'}},
    freeze: {path: 'catalog/product-bridge-calibrations/g678-nms-l02-p055-conditional-host-current-js-v1.json',
      sha256: '1'.repeat(64)},
    glossary: {candidateSha256: 'cfc1e81cf4da194d2d110ccd7ca879ce43950361883319a2e6bcebd135f1543f',
      product: {path: 'packages/demos/src/generated/nms-l02-p055-terms-v1.ts', bytes: 4326,
        sha256: 'a040b5821f4eab812c04bcf47b399235350171c4d83be36bfb1b53e5fdeeb1aa'},
      sourceSelection: 'identified-indexMI-export-literal-L1-bank-path',
      originalL2XmlResolved: false,
      historicalHostAssociationEstablished: false,
      originalRuntimeLookupVerified: false},
  };
}

test('P055 extends only page 55 and adds only absent qualified terms', () => {
  const base = predecessor(), facts = provenance();
  const result = extendNmsL02P055Descriptor(base, facts);
  assert.equal(result.productBridge.registeredAnimationCount, 55);
  assert.deepEqual(result.productBridge.selectedAnimationIds,
    [...base.productBridge.selectedAnimationIds, id(55)]);
  assert.equal(result.pages.length, 64);
  for (let index = 0; index < 64; index++) {
    if (index !== 54) assert.equal(result.pages[index], base.pages[index]);
  }
  assert.equal(base.pages[54].rendererAvailability.kind, 'unavailable');
  assert.deepEqual(result.pages[54].rendererAvailability, {kind: 'registered', moduleKey: id(55),
    runtimeQuery: {frameDomain: 'sprite-26', language: 'fixed-en',
      scenario: 'source-static-frame', seed: '0'}});
  assert.deepEqual(result.pages[54].runtimeEvidenceBoundary, {
    runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
    actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
    audioAcceptance: 'not-established',
    replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
    productBehavior: 'maintained-javascript-state-machine-implemented',
    productVisualBehaviorComposite: 'not-established',
  });
  assert.equal(result.glossary.length, 3);
  assert.equal(result.glossary[0], base.glossary[0]);
  assert.deepEqual(result.glossary.map(term => term.id), ['problem', 'restate', 'question']);
  assert.deepEqual(base.glossary.map(term => term.id), ['problem']);
  assert.equal(P055_DESCRIPTOR_GLOSSARY_QUALIFICATION.originalL2XmlResolved, false);
  assert.equal(P055_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished, false);
});

test('P055 rejects count, order, XML, source, availability, and glossary conflicts', () => {
  const base = predecessor(), facts = provenance();
  const wrongCount = structuredClone(base) as any;
  wrongCount.productBridge.registeredAnimationCount = 53;
  assert.throws(() => extendNmsL02P055Descriptor(wrongCount, facts), /predecessor counts/u);
  const wrongOrder = structuredClone(base) as any;
  [wrongOrder.pages[53], wrongOrder.pages[54]] = [wrongOrder.pages[54], wrongOrder.pages[53]];
  assert.throws(() => extendNmsL02P055Descriptor(wrongOrder, facts), /source order|placement/u);
  const wrongXml = structuredClone(base) as any;
  wrongXml.source.sourceXmlSha256 = '0'.repeat(64);
  assert.throws(() => extendNmsL02P055Descriptor(wrongXml, facts), /source XML/u);
  const wrongSource = structuredClone(base) as any;
  wrongSource.pages[54].source.assetId = 'swf-other';
  assert.throws(() => extendNmsL02P055Descriptor(wrongSource, facts), /placement/u);
  const available = structuredClone(base) as any;
  available.pages[54].rendererAvailability = {kind: 'registered', moduleKey: id(55)};
  assert.throws(() => extendNmsL02P055Descriptor(available, facts), /placement/u);
  const conflicting = structuredClone(base) as any;
  conflicting.glossary[0].definitions.en = 'conflicting definition';
  assert.throws(() => extendNmsL02P055Descriptor(conflicting, facts), /glossary collision/u);
  const wrongCandidate = structuredClone(facts);
  (wrongCandidate as any).glossary.originalL2XmlResolved = true;
  assert.throws(() => extendNmsL02P055Descriptor(base, wrongCandidate), /conditional glossary/u);
  const wrongCalibration = structuredClone(facts) as any;
  wrongCalibration.calibrationId = 'g678-nms-l02-p055-other-current-js-v1';
  assert.throws(() => extendNmsL02P055Descriptor(base, wrongCalibration), /calibration ID/u);
  const wrongFreeze = structuredClone(facts) as any;
  wrongFreeze.freeze.path = 'output/nms-l02-host-successor-20260927/p055-freeze.json';
  assert.throws(() => extendNmsL02P055Descriptor(base, wrongFreeze), /freeze pin/u);
});
