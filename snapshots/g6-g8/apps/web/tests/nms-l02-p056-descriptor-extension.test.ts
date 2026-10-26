import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {P056_SOURCE_TERMS} from '../../../packages/demos/src/generated/nms-l02-p056-terms-v1';
import {extendNmsL02P055Descriptor, type NmsL02P055DescriptorProvenance}
  from '../lib/nms-l02-p055-descriptor-extension';
import {extendNmsL02P056Descriptor, P056_DESCRIPTOR_GLOSSARY_QUALIFICATION,
  type NmsL02P056DescriptorProvenance} from '../lib/nms-l02-p056-descriptor-extension';
import type {PageOnlyLessonPlayerDescriptor} from '../lib/whole-lesson-player-descriptor';

const SOURCE_SHA = 'a1872d6c20987340889c1077d6720cbfe046faa3b5228164987e0834f3c639be';
const XML_SHA = '550aee4286e8a701caf3dc58360f709a606561db8b766057ac36720833d7ff61';
const PRODUCT_SHA = '331a6ff6a22ee637de230d5a951cf8ff77f13f52d225cdfd17be20b4d1640e50';
const id = (ordinal: number) => `shared-nms002-l02-p${String(ordinal).padStart(3, '0')}`;
const sha = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function pinnedJson(relative: string, bytes: number, digest: string): any {
  const content = readFileSync(new URL(`../../../${relative}`, import.meta.url));
  assert.equal(content.length, bytes, relative);
  assert.equal(sha(content), digest, relative);
  return JSON.parse(content.toString('utf8'));
}

/** Real frozen P052 witness plus the separately frozen P055 page packet. */
function actualP055Predecessor(): PageOnlyLessonPlayerDescriptor {
  const witness = pinnedJson('output/nms-l02-host-successor-20260927/predecessor/descriptor-witness-two-stage-v1.json',
    137815, '01cb25723b10cc2ce5a0a39e699420a08c7815804b0fe21988c5b155323230b6');
  const proof = pinnedJson('work/g678-workflow/candidates/shared-nms002-l02-p055-v1.json',
    41970, '6d7b37096d01b7f712ebde9c461652733177b64cd654ecb75a9f0d656291bae1');
  pinnedJson(witness.descriptorFile.path, witness.descriptorFile.bytes, witness.descriptorFile.sha256);
  pinnedJson(proof.freeze.path, proof.freeze.bytes, proof.freeze.sha256);
  const packet = proof.packet, selected = packet.selectedPages[0];
  const provenance: NmsL02P055DescriptorProvenance = {
    calibrationId: packet.calibrationId, sourceXml: packet.sourceXml,
    source: {...packet.source, path: `${packet.sourceRoot}/${packet.source.path}`},
    selectedPage: {animationId: selected.animationId, placementId: selected.placementId,
      assetId: selected.assetId, globalPageOrdinal: selected.globalPageOrdinal,
      sectionCode: selected.sectionCode, sectionPageOrdinal: selected.sectionPageOrdinal,
      sourceOccurrence: selected.sourceOccurrence, sourceSha256: selected.sourceSha256,
      runtime: selected.runtime},
    freeze: proof.freeze, glossary: packet.glossary,
  };
  return extendNmsL02P055Descriptor(witness.descriptor as PageOnlyLessonPlayerDescriptor, provenance);
}

/** Shape of a future verified P056 packet; the placeholder digest is not a
 * freeze attestation. The server proof reader must verify the real pin. */
function provenance(): NmsL02P056DescriptorProvenance {
  return {
    calibrationId: 'g678-nms-l02-p056-conditional-host-current-js-v1',
    sourceXml: {path: 'G6-G8-shared/NMS002/L2/index.xml', bytes: 12845, sha256: XML_SHA},
    source: {path: '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware/G6-G8-shared/NMS002/L2/TS/L2TS03.swf',
      bytes: 100959, sha256: SOURCE_SHA},
    selectedPage: {animationId: id(56), placementId: id(56), globalPageOrdinal: 56,
      sectionCode: 'TS', sectionPageOrdinal: 2, sourceOccurrence: 56,
      assetId: `swf-${SOURCE_SHA}`, sourceSha256: SOURCE_SHA,
      runtime: {frameDomain: 'sprite-24', frameCount: 234, rootBeginFrame: 6,
        fps: 12, stage: {width: 800, height: 600}, scenario: 'source-static-frame'}},
    freeze: {path: 'catalog/product-bridge-calibrations/g678-nms-l02-p056-conditional-host-current-js-v1.json',
      sha256: 'f'.repeat(64)},
    glossary: {candidateSha256: '7e8aa4a172d2fd0052b968735ab6629ad3b5107ca9e60b9c6e73ac9f4d78f747',
      product: {path: 'packages/demos/src/generated/nms-l02-p056-terms-v1.ts',
        bytes: 3209, sha256: PRODUCT_SHA},
      sourceSelection: 'identified-indexMI-export-literal-L1-bank-path',
      originalL2XmlResolved: false, historicalHostAssociationEstablished: false,
      originalRuntimeLookupVerified: false},
  };
}

test('formal P056 extension uses real 55-page noncontiguous predecessor and changes only page 56', () => {
  const base = actualP055Predecessor(), before = structuredClone(base), facts = provenance();
  const termBytes = readFileSync(new URL('../../../packages/demos/src/generated/nms-l02-p056-terms-v1.ts', import.meta.url));
  assert.equal(termBytes.length, 3209); assert.equal(sha(termBytes), PRODUCT_SHA);
  const prior = [...Array.from({length: 52}, (_, index) => id(index + 1)), id(55), id(59), id(63)];
  assert.deepEqual(base.productBridge.selectedAnimationIds, prior);
  const result = extendNmsL02P056Descriptor(base, facts);
  assert.equal(result.productBridge.registeredAnimationCount, 56);
  assert.deepEqual(result.productBridge.selectedAnimationIds,
    [...prior.slice(0, 53), id(56), ...prior.slice(53)]);
  assert.equal(result.pages.length, 64);
  for (let index = 0; index < 64; index++) if (index !== 55)
    assert.equal(result.pages[index], base.pages[index]);
  assert.equal(base.pages[55].rendererAvailability.kind, 'unavailable');
  assert.deepEqual(result.pages[55].rendererAvailability, {kind: 'registered', moduleKey: id(56),
    runtimeQuery: {frameDomain: 'sprite-24', language: 'fixed-en',
      scenario: 'source-static-frame', seed: '0'}});
  assert.deepEqual(result.pages[55].runtimeEvidenceBoundary, {
    runtimeKind: 'source-script-bound-product-behavior-current-js-candidate',
    actionScriptExecution: 'not-executed', naturalTraceValidation: 'not-established',
    audioAcceptance: 'not-established',
    replaySemantics: 'product-complete-interaction-reset-original-runtime-parity-not-established',
    productBehavior: 'maintained-javascript-state-machine-implemented',
    productVisualBehaviorComposite: 'not-established',
  });
  assert.deepEqual(result.glossary.slice(-2).map(term => term.id), ['organize', 'information']);
  assert.deepEqual(result.glossary.slice(-2).map(term => term.sourceKeyAttribute),
    P056_SOURCE_TERMS.map(term => term.sourceKeyAttribute));
  assert.deepEqual(result.productBridge.acceptanceEffects, base.productBridge.acceptanceEffects);
  assert.equal(result.source.candidateFreezeManifestPath, facts.freeze.path);
  assert.equal(result.source.candidateFreezeManifestSha256, facts.freeze.sha256);
  assert.equal(result.calibrationId, facts.calibrationId);
  assert.equal(result.course.href, `/migration-status/g678-calibration/${id(56)}`);
  assert.deepEqual(base, before, 'extension cannot mutate verified predecessor');
  assert.equal(P056_DESCRIPTOR_GLOSSARY_QUALIFICATION.originalL2XmlResolved, false);
  assert.equal(P056_DESCRIPTOR_GLOSSARY_QUALIFICATION.historicalHostAssociationEstablished, false);
  assert.equal(P056_DESCRIPTOR_GLOSSARY_QUALIFICATION.modernHostSelection,
    'conditional-identified-host-L1-bank');
});

test('exact pre-existing qualified term is reused; id, key, and definition collisions fail', () => {
  const base = actualP055Predecessor(), facts = provenance();
  const identical = structuredClone(base) as any;
  identical.glossary.push(P056_SOURCE_TERMS[0]);
  const result = extendNmsL02P056Descriptor(identical, facts);
  assert.equal(result.glossary.length, base.glossary.length + 2);
  assert.equal(result.glossary.find(term => term.id === 'organize'), identical.glossary.at(-1));
  for (const change of [
    (copy: any) => copy.glossary.push({...P056_SOURCE_TERMS[0], definitions: {en: 'wrong', es: 'wrong'}}),
    (copy: any) => copy.glossary.push({...P056_SOURCE_TERMS[0], id: 'other-id'}),
    (copy: any) => copy.glossary.push(copy.glossary[0]),
  ]) {
    const copy = structuredClone(base) as any; change(copy);
    assert.throws(() => extendNmsL02P056Descriptor(copy, facts), /glossary collision|glossary uniqueness/u);
  }
});

test('P056 fails closed on source order, noncontiguous registration, target, acceptance and provenance drift', () => {
  const base = actualP055Predecessor(), facts = provenance();
  const wrongBase = (change: (copy: any) => void, reason: RegExp) => {
    const copy = structuredClone(base) as any; change(copy);
    assert.throws(() => extendNmsL02P056Descriptor(copy, facts), reason);
  };
  wrongBase(copy => {copy.pages[55].source.sourceOccurrence = 57;}, /source order/u);
  wrongBase(copy => {copy.pages[54].nextPlacementId = id(57);}, /source order/u);
  wrongBase(copy => {copy.pages[55].previousAnimationId = id(54);}, /source order/u);
  wrongBase(copy => {copy.pages[62].rendererAvailability = {kind: 'unavailable', reason: 'drift'};},
    /registered P055 predecessor/u);
  wrongBase(copy => {copy.pages[53].rendererAvailability = {kind: 'registered', moduleKey: id(54)};},
    /registered P055 predecessor/u);
  wrongBase(copy => {copy.productBridge.selectedAnimationIds.pop();}, /registered P055 predecessor/u);
  wrongBase(copy => {copy.pages[55].source.assetId = 'swf-wrong';}, /P056 placement/u);
  wrongBase(copy => {copy.pages[55].rendererAvailability = {kind: 'registered', moduleKey: id(56)};},
    /P056 placement/u);
  wrongBase(copy => {copy.productBridge.acceptanceEffects.audioAccepted = true;}, /acceptance boundary/u);
  wrongBase(copy => {copy.source.sourceXmlSha256 = '0'.repeat(64);}, /source XML/u);
  const wrongFacts = (change: (copy: any) => void, reason: RegExp) => {
    const copy = structuredClone(facts) as any; change(copy);
    assert.throws(() => extendNmsL02P056Descriptor(base, copy), reason);
  };
  wrongFacts(copy => {copy.source.bytes = 100958;}, /SWF pin/u);
  wrongFacts(copy => {copy.selectedPage.runtime.frameCount = 351;}, /selected P056 runtime/u);
  wrongFacts(copy => {copy.selectedPage.sourceOccurrence = 55;}, /selected P056 source placement/u);
  wrongFacts(copy => {copy.freeze.path = 'output/unreviewed.json';}, /freeze pin/u);
  wrongFacts(copy => {copy.glossary.product.sha256 = '0'.repeat(64);}, /conditional glossary pin/u);
  wrongFacts(copy => {copy.glossary.originalL2XmlResolved = true;}, /conditional glossary pin/u);
});
