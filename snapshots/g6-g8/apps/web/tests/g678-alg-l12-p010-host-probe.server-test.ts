import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {lstatSync, readFileSync, realpathSync} from 'node:fs';
import test from 'node:test';

import {hasLocalOnlyAnimationModule, localOnlyAnimationModuleRegistration,
  registeredLocalOnlyAnimationKeys} from '../../../packages/demos/src/local-only-animation-registry-metadata';
import {P010_GLOSSARY_TERMS} from '../../../packages/demos/src/alg-l12-p010-glossary';
import {algL12P009CurrentJsDescriptor, ALG_L12_P009_CURRENT_JS_CALIBRATION,
  readAlgL12P009CurrentJsPacket} from '../lib/g678-alg-l12-p009-current-js-v2.server';
import {ALG_L12_P010_ID, algL12P010HostProbeDescriptor} from '../lib/g678-alg-l12-p010-host-probe.server';
import {supplementP010Glossary} from '../lib/g678-alg-l12-p010-glossary.server';
import type {PageOnlyLessonGlossaryEntry} from '../lib/whole-lesson-player-descriptor';

const SOURCE_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/AWS Grade-Classified Courseware';
const SOURCE_FILE = `${SOURCE_ROOT}/G6-G8-shared/ALG001/L12/VB/L12VB05.swf`;
const SOURCE_SHA = 'a846950547f7c3ab7b0445dfc2118d534565ffd352b6e9687ba8211e5d4a3fcd';
const DICTIONARY_ROOT = '/Volumes/WestWorld/HELP MATH Related Files/HELP_OnlineKeyTerms_XML/MI';
const DICTIONARIES = [
  {path: `${DICTIONARY_ROOT}/L1KTE01.xml`, bytes: 345838, sha256: '14d454f4c1c1a6f0939fb80b454fd3e22890eabb4a730c6bfa7efa1d9a2e5e5b'},
  {path: `${DICTIONARY_ROOT}/L1KTS01.xml`, bytes: 344456, sha256: '3b437b42e75536fa8b4f110325e366c27fbe10a871439d4797650cda4238b407'},
] as const;
const EXTRA_KEYS = ['Geometric figures', 'Position', 'length', 'Width', 'Height'] as const;
const env: Record<string, string | undefined> = process.env;
const ENV_KEYS = ['NODE_ENV', 'VERCEL_ENV', 'HELP_MATH_G678_LOCAL_PREVIEW',
  'HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'HELP_MATH_G678_SOURCE_ROOT'] as const;
const hash = (bytes: string | Uint8Array) => createHash('sha256').update(bytes).digest('hex');

function local(run: () => void) {
  const before = Object.fromEntries(ENV_KEYS.map(key => [key, env[key]]));
  try {
    env.NODE_ENV = 'development'; delete env.VERCEL_ENV;
    env.HELP_MATH_G678_LOCAL_PREVIEW = '1'; env.HELP_MATH_G678_LOCAL_PREVIEW_BIND = '127.0.0.1';
    env.HELP_MATH_G678_SOURCE_ROOT = SOURCE_ROOT;
    run();
  } finally {
    for (const key of ENV_KEYS) { if (before[key] === undefined) delete env[key]; else env[key] = before[key]; }
  }
}

function registrySnapshot() {
  const files = ['packages/demos/private-current-js-registry.json',
    'packages/demos/src/registry.generated.ts', 'packages/demos/src/registry.local-only.generated.ts',
    'packages/demos/src/registry.local-only.metadata.generated.ts'];
  return {keys: [...registeredLocalOnlyAnimationKeys], files: files.map(path => ({path,
    sha256: hash(readFileSync(new URL(`../../../${path}`, import.meta.url)))}))};
}

test('P010 probe extends actual formal P009 v2 from 21 to 22 simulated pages without registration or source-order changes', () => local(() => {
  const registryBefore = registrySnapshot();
  assert.equal(ALG_L12_P009_CURRENT_JS_CALIBRATION, 'g678-alg-l12-p009-current-js-v2');
  const packet = readAlgL12P009CurrentJsPacket();
  assert.equal(packet.calibrationId, ALG_L12_P009_CURRENT_JS_CALIBRATION);
  assert.equal(hasLocalOnlyAnimationModule('shared-alg001-l12-p009'), true);
  assert.equal(localOnlyAnimationModuleRegistration('shared-alg001-l12-p009')?.calibrationId,
    'g678-alg-l12-p009-current-js-v2');
  assert.equal(hasLocalOnlyAnimationModule(ALG_L12_P010_ID), false);
  assert.equal(localOnlyAnimationModuleRegistration(ALG_L12_P010_ID), undefined);
  const formal = algL12P009CurrentJsDescriptor(), before = JSON.stringify(formal);
  const probe = algL12P010HostProbeDescriptor();
  assert.equal(formal.calibrationId, 'g678-alg-l12-p009-current-js-v2');
  assert.equal(formal.pages.length, 52); assert.equal(probe.pages.length, 52);
  assert.equal(formal.productBridge.registeredAnimationCount, 21);
  assert.equal(probe.productBridge.registeredAnimationCount, 22);
  assert.equal(formal.productBridge.pageOnlyDescriptorMemberCount, 52);
  const original = formal.pages[9]!, page = probe.pages[9]!;
  assert.equal(original.rendererAvailability.kind, 'unavailable');
  assert.equal(page.placementId, ALG_L12_P010_ID); assert.equal(page.animationId, ALG_L12_P010_ID);
  assert.equal(page.globalPageOrdinal, 10); assert.equal(page.sectionPageOrdinal, 4); assert.equal(page.sectionCode, 'VB');
  assert.equal(page.previousPlacementId, 'shared-alg001-l12-p009'); assert.equal(page.nextPlacementId, 'shared-alg001-l12-p011');
  assert.equal(page.source.assetId, `swf-${SOURCE_SHA}`); assert.deepEqual(page.source, original.source);
  assert.deepEqual(page.rendererAvailability, {kind: 'registered', moduleKey: ALG_L12_P010_ID,
    runtimeQuery: {frameDomain: 'sprite-96', language: 'fixed-en', scenario: 'source-static-frame', seed: '0'}});
  const sourcePlacement = (item: typeof original) => Object.fromEntries(Object.entries(item)
    .filter(([key]) => key !== 'rendererAvailability' && key !== 'runtimeEvidenceBoundary'));
  assert.deepEqual(sourcePlacement(page), sourcePlacement(original), 'P010 labels, source identity and navigation remain exact');
  assert.deepEqual(probe.pages.filter((_, index) => index !== 9), formal.pages.filter((_, index) => index !== 9));
  assert.deepEqual(probe.pages.map(item => item.placementId), formal.pages.map(item => item.placementId));
  assert.deepEqual(probe.pages.map(item => item.globalPageOrdinal), Array.from({length: 52}, (_, index) => index + 1));
  assert.deepEqual(probe.sections, formal.sections); assert.deepEqual(probe.course.labels, formal.course.labels);
  assert.equal(probe.productBridge.selectedAnimationIds.length, 22);
  assert.equal(new Set(probe.productBridge.selectedAnimationIds).size, 22);
  assert.deepEqual(probe.productBridge.selectedAnimationIds.filter(id => id !== ALG_L12_P010_ID), formal.productBridge.selectedAnimationIds);
  assert.deepEqual(probe.productBridge.acceptanceEffects, formal.productBridge.acceptanceEffects);
  assert.ok(Object.values(probe.productBridge.acceptanceEffects).every(value => value === false));
  assert.equal(page.runtimeEvidenceBoundary?.actionScriptExecution, 'not-executed');
  assert.equal(page.runtimeEvidenceBoundary?.audioAcceptance, 'not-established');
  assert.equal(page.runtimeEvidenceBoundary?.naturalTraceValidation, 'not-established');
  assert.equal(page.runtimeEvidenceBoundary?.productVisualBehaviorComposite, 'not-established');
  assert.equal(probe.calibrationId, 'g678-alg-l12-p010-unregistered-host-probe-v1');
  assert.match(probe.descriptorId, /:p010-unregistered-host-probe$/u); assert.match(probe.releaseId, /:p010-unregistered-host-probe$/u);
  assert.notEqual(probe.persistence.storageKey, formal.persistence.storageKey);
  assert.equal(probe.course.href, '/migration-status/g678-calibration/shared-alg001-l12-p010');
  assert.ok(Object.isFrozen(probe)); assert.ok(Object.isFrozen(probe.pages));
  assert.equal(JSON.stringify(formal), before);
  assert.equal(realpathSync(SOURCE_FILE), SOURCE_FILE); assert.equal(lstatSync(SOURCE_FILE).nlink, 1);
  const source = readFileSync(SOURCE_FILE); assert.equal(source.length, 183770); assert.equal(hash(source), SOURCE_SHA);
  for (const term of P010_GLOSSARY_TERMS)
    assert.equal(probe.glossary.filter(entry => entry.sourceKeyAttribute === term.sourceKeyAttribute).length, 1);
  assert.deepEqual(registrySnapshot(), registryBefore);
  assert.equal(hasLocalOnlyAnimationModule(ALG_L12_P010_ID), false);
  assert.equal(algL12P009CurrentJsDescriptor().productBridge.registeredAnimationCount, 21);
}));

type DictionaryRecord = {literalKey: string; firstLine: number; lastLine: number; sourceTagName: string;
  sourceAttributes: string; sourceLabelEn: string; sourceLabelEs: string; definitionEn: string; definitionEs: string;
  definitionSha256: string; lookup: {kind: string; from: string; to: string; genericCaseNormalizationAllowed: boolean}};
type Keyterms = {animationId: string; sourceSha256: string; explicitCaseCrosswalks: {from: string; to: string}[];
  sources: {path: string; bytes: number; sha256: string; records: DictionaryRecord[]}[]};
const plain = (text: string) => text.replaceAll('&nbsp;', ' ').replace(/\s+/gu, ' ').trim();

test('P010 adds exactly five real bilingual dictionary entries and keeps the explicit length-to-Length lookup', () => local(() => {
  const formal = algL12P009CurrentJsDescriptor(), glossary = supplementP010Glossary(formal.glossary);
  assert.equal(glossary.length, formal.glossary.length + 5);
  assert.deepEqual(glossary.slice(0, formal.glossary.length), formal.glossary);
  assert.deepEqual(glossary.slice(formal.glossary.length).map(entry => entry.sourceKeyAttribute), EXTRA_KEYS);
  const bytes = readFileSync(new URL('../../../migrations/shared-alg001-l12-p010/audit/source-keyterms.json', import.meta.url));
  assert.equal(bytes.length, 27860); assert.equal(hash(bytes), '9f524c88c59e9a3ce3a1e39e5461bb4b3c9c5b93e13c0d03daa60c2baeb41c07');
  const audit = JSON.parse(bytes.toString()) as Keyterms;
  assert.equal(audit.animationId, ALG_L12_P010_ID); assert.equal(audit.sourceSha256, SOURCE_SHA);
  assert.deepEqual(audit.explicitCaseCrosswalks, [{from: 'length', to: 'Length'}]); assert.equal(audit.sources.length, 2);
  const origin = formal.glossary.find(entry => entry.source.en.sha256 === DICTIONARIES[0].sha256 &&
    entry.source.es.sha256 === DICTIONARIES[1].sha256)!.source;
  for (const [index, dictionary] of DICTIONARIES.entries()) {
    const physical = readFileSync(dictionary.path); assert.equal(realpathSync(dictionary.path), dictionary.path);
    assert.equal(lstatSync(dictionary.path).nlink, 1); assert.equal(physical.length, dictionary.bytes); assert.equal(hash(physical), dictionary.sha256);
    const source = audit.sources[index]!; assert.equal(source.path, dictionary.path);
    assert.equal(source.bytes, dictionary.bytes); assert.equal(source.sha256, dictionary.sha256);
    const lines = physical.toString().split(/\r?\n/u);
    for (const key of EXTRA_KEYS) {
      const records = source.records.filter(record => record.literalKey === key); assert.equal(records.length, 1);
      const record = records[0]!, actual = lines.slice(record.firstLine - 1, record.lastLine).join('\n').trim();
      const opening = `<${record.sourceTagName} ${record.sourceAttributes}>`, closing = `</${record.sourceTagName}>`;
      assert.ok(actual.startsWith(opening)); assert.ok(actual.endsWith(closing));
      const definitions = actual.slice(opening.length, -closing.length);
      assert.equal(hash(definitions), record.definitionSha256); assert.deepEqual(definitions.split('~LNG~'), [record.definitionEn, record.definitionEs]);
      assert.deepEqual(record.lookup, {kind: key === 'length' ? 'explicit-case-crosswalk' : 'exact-literal',
        from: key, to: key === 'length' ? 'Length' : key, genericCaseNormalizationAllowed: false});
      const entries = glossary.filter(entry => entry.sourceKeyAttribute === key); assert.equal(entries.length, 1);
      const entry = entries[0]!; assert.equal(entry.id, key.toLowerCase().replaceAll(' ', '-'));
      assert.deepEqual(entry.labels, {en: plain(record.sourceLabelEn), es: plain(record.sourceLabelEs)});
      assert.deepEqual(entry.definitions, {en: plain(record.definitionEn), es: plain(record.definitionEs)});
      assert.deepEqual(entry.source, origin); assert.equal(entry.source.en.assetId, 'G678L1KTE01.xml'); assert.equal(entry.source.es.assetId, 'G678L1KTS01.xml');
      assert.ok(Object.values(entry.labels).every(text => !/[<>]|&[A-Za-z#]/u.test(text)));
      assert.ok(Object.values(entry.definitions).every(text => !/[<>]|&[A-Za-z#]/u.test(text)));
    }
  }
  const length = glossary.find(entry => entry.sourceKeyAttribute === 'length')!;
  assert.equal(length.labels.en, 'Length');
  assert.equal(glossary.filter(entry => entry.sourceKeyAttribute === 'Length').length, 0);
  const positions = P010_GLOSSARY_TERMS.filter(term => term.sourceKeyAttribute === 'Position');
  assert.equal(positions.length, 2); assert.equal(glossary.filter(entry => entry.sourceKeyAttribute === 'Position').length, 1);
}));

test('P010 glossary preserves predecessor references and rejects missing identity, duplicates and ID collisions', () => local(() => {
  const base = algL12P009CurrentJsDescriptor().glossary, before = JSON.stringify(base);
  const supplemented = supplementP010Glossary(base); assert.ok(Object.isFrozen(supplemented));
  base.forEach((entry, index) => assert.equal(supplemented[index], entry));
  assert.equal(JSON.stringify(base), before);
  assert.throws(() => supplementP010Glossary([]), /no matching canonical dictionary identity/u);
  const missing = base.map(entry => ({...entry, source: {
    en: {...entry.source.en, sha256: '0'.repeat(64)}, es: {...entry.source.es, sha256: '0'.repeat(64)},
  }}));
  assert.throws(() => supplementP010Glossary(missing), /no matching canonical dictionary identity/u);
  const template = base[0]!;
  for (const key of EXTRA_KEYS) {
    const duplicate: PageOnlyLessonGlossaryEntry = {...template, id: `duplicate-${key}`, sourceKeyAttribute: key};
    assert.throws(() => supplementP010Glossary([...base, duplicate]), /duplicate supplemental key/u);
    const collision: PageOnlyLessonGlossaryEntry = {...template, id: key.toLowerCase().replaceAll(' ', '-'), sourceKeyAttribute: 'Unrelated source key'};
    assert.throws(() => supplementP010Glossary([...base, collision]), /supplemental entry ID collision/u);
  }
  assert.throws(() => supplementP010Glossary(supplemented), /duplicate supplemental key/u);
  assert.equal(JSON.stringify(base), before);
}));

test('P010 probe rejects production/provider scope, broad binding, absent opt-in and source-root substitution', () => {
  const cases: ReadonlyArray<readonly [typeof ENV_KEYS[number], string | undefined]> = [
    ['NODE_ENV', 'production'], ['VERCEL_ENV', 'preview'], ['VERCEL_ENV', 'production'],
    ['HELP_MATH_G678_LOCAL_PREVIEW', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW', '0'], ['HELP_MATH_G678_LOCAL_PREVIEW', 'TRUE'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', undefined], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '0.0.0.0'],
    ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', 'localhost'], ['HELP_MATH_G678_LOCAL_PREVIEW_BIND', '::1'],
    ['HELP_MATH_G678_SOURCE_ROOT', undefined], ['HELP_MATH_G678_SOURCE_ROOT', '/nonexistent'],
    ['HELP_MATH_G678_SOURCE_ROOT', `${SOURCE_ROOT}/`],
    ['HELP_MATH_G678_SOURCE_ROOT', '/Volumes/WestWorld/HELP MATH 2.0/source-assets/G6-G8-shared'],
  ];
  for (const [key, value] of cases) local(() => {
    if (value === undefined) delete env[key]; else env[key] = value;
    assert.throws(() => algL12P010HostProbeDescriptor(), /unregistered local-only probe|P010 local typography binding required/u);
  });
});

test('P010 local page retains EN/ES guards, unpublished gates and compile-time production stub without changing Next config', () => {
  const page = readFileSync(new URL('../app/[locale]/migration-status/g678-calibration/shared-alg001-l12-p010/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /process\.env\.NODE_ENV === 'production'/u);
  assert.match(page, /locale !== 'en' && locale !== 'es'/u);
  assert.match(page, /isG678LocalPreviewRequestHeaders\(await headers\(\)\)/u);
  assert.match(page, /catch \{notFound\(\);\}/u);
  assert.match(page, /robots: \{index: false, follow: false, noarchive: true\}/u);
  assert.match(page, /process\.env\.NODE_ENV === 'production'\s*\? (?:await )?import\('@\/lib\/g678-alg-l12-p010-host\.production-stub'\)\s*:\s*(?:await )?import\('@\/components\/g678-alg-l12-p010-host-lesson'\)/u);
  assert.match(page, /const formal = false/u);
  assert.match(page, /registered\.has\(page\.animationId\)/u);
  assert.match(page, /initialPlacementId=\{ALG_L12_P010_ID\}/u);
  assert.match(page, /audioEnabled=\{false\}/u);
  assert.match(page, /releasePublished=\{false\} strictCompleteMemberCount=\{0\}/u);
  assert.match(page, /This page is unpublished/u);
  assert.match(page, /English source text is not a Spanish translation/u);
  const config = readFileSync(new URL('../next.config.ts', import.meta.url));
  assert.equal(hash(config), '009036b0124ec8aacfe8a3b01d1ee24d29d9c3a6de28fbbf6355460745759dda');
});
